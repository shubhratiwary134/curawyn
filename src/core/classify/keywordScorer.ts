import { VideoMeta, Settings, Subgenre } from '../types';

export interface ScoredSubgenre {
  subgenre: Subgenre;
  genreId: string;
  score: number;
}

export interface KeywordScoringResult {
  topSubgenre: ScoredSubgenre | null;
  secondSubgenre: ScoredSubgenre | null;
  genreId?: string;
  subgenreId?: string;
  confidence: number;
  allMatches: ScoredSubgenre[];
}

export function scoreSubgenres(
  meta: VideoMeta,
  settings: Settings
): KeywordScoringResult {
  const titleLower = (meta.title || '').toLowerCase();
  const channelLower = (meta.channel?.name || '').toLowerCase();
  const descLower = (meta.description || '').toLowerCase();
  const tagsLower = (meta.tags || []).map((t) => t.toLowerCase());

  const scores: ScoredSubgenre[] = [];

  for (const subgenre of Object.values(settings.subgenres)) {
    const parentGenre = settings.genres[subgenre.genreId];
    if (!parentGenre) continue;

    let subScore = 0;

    // Check exclude keywords first: if any exclude keyword appears in title, discard or heavily penalize
    let excluded = false;
    for (const ex of subgenre.exclude) {
      const exLower = ex.toLowerCase().trim();
      if (!exLower) continue;
      if (titleLower.includes(exLower)) {
        excluded = true;
        break;
      }
    }
    if (excluded) {
      continue;
    }

    // Score include terms
    for (const kw of subgenre.include) {
      const term = kw.term.toLowerCase().trim();
      if (!term) continue;

      let termMatched = false;

      // 1. Title match (weight * 3)
      if (titleLower.includes(term)) {
        subScore += kw.weight * 3;
        termMatched = true;
      }

      // 2. Channel match (weight * 2)
      if (channelLower.includes(term)) {
        subScore += kw.weight * 2;
        termMatched = true;
      }

      // 3. Description / tags match (weight * 1)
      if (!termMatched) {
        if (descLower.includes(term) || tagsLower.some((t) => t.includes(term))) {
          subScore += kw.weight * 1;
        }
      }
    }

    // Category hint bonus: if YouTube category matches parent genre
    if (
      meta.ytCategoryId &&
      parentGenre.ytCategoryIds &&
      parentGenre.ytCategoryIds.includes(meta.ytCategoryId)
    ) {
      subScore += 3;
    }

    if (subScore > 0) {
      scores.push({
        subgenre,
        genreId: subgenre.genreId,
        score: subScore
      });
    }
  }

  // Sort descending by score
  scores.sort((a, b) => b.score - a.score);

  const top = scores[0] || null;
  const second = scores[1] || null;

  const minScore = 2;
  if (!top || top.score < minScore) {
    return {
      topSubgenre: null,
      secondSubgenre: null,
      confidence: 0,
      allMatches: []
    };
  }

  const topScore = top.score;
  const secondScore = second ? second.score : 0;

  // Confidence formula: clamp(top / (top + second + 1), 0, 1)
  const rawConfidence = topScore / (topScore + secondScore + 1);
  const confidence = Math.min(1, Math.max(0, rawConfidence));

  return {
    topSubgenre: top,
    secondSubgenre: second,
    genreId: top.genreId,
    subgenreId: top.subgenre.id,
    confidence: Number(confidence.toFixed(2)),
    allMatches: scores
  };
}
