import { ContentTypeId, VideoMeta } from '../types';

export function detectContentTypes(meta: VideoMeta): ContentTypeId[] {
  const title = (meta.title || '').toLowerCase();
  const durSec = meta.durationSec || 0;
  const types = new Set<ContentTypeId>();

  // 1. Tutorial
  if (
    /\b(how to|tutorial|guide|step by step|walkthrough|beginner's guide|course|crash course|build a|learn)\b/i.test(
      title
    )
  ) {
    types.add('tutorial');
  }

  // 2. Comparison
  if (/\b(vs\.?|versus|compared|comparison|which is better|shootout|face off)\b/i.test(title)) {
    types.add('comparison');
  }

  // 3. Review
  if (
    /\b(review|ownership|long.?term review|impressions|hands on|worth it|tested for|honest thoughts)\b/i.test(
      title
    )
  ) {
    types.add('review');
  }

  // 4. Documentary
  if (
    /\b(documentary|the story of|history of|rise and fall|retrospective|investigation|the rise of)\b/i.test(
      title
    )
  ) {
    types.add('documentary');
  }

  // 5. Experiment & Demonstration
  if (
    /\b(experiment|tested|we tried|what happens|mythbusters|testing|can you|i tried|science test|demonstration)\b/i.test(
      title
    )
  ) {
    types.add('experiment');
  }

  // 6. Interview & Podcast
  if (
    /\b(podcast|interview|ep\.?\s*\d+|talk show|fireside chat|with guests|speaks with)\b/i.test(
      title
    ) ||
    (durSec >= 2400 && /\b(conversation|speaks with|show|episode)\b/i.test(title))
  ) {
    types.add('interview_podcast');
  }

  // 7. Analysis & Breakdown
  if (
    /\b(analysis|breakdown|explaining|explained|deep dive|case study|why .* failed|why .* succeeded)\b/i.test(
      title
    )
  ) {
    types.add('analysis');
  }

  // 8. Educational
  if (
    /\b(lecture|lesson|calculus|fundamentals|theory|physics|mechanics|introduction to)\b/i.test(
      title
    )
  ) {
    types.add('educational');
  }

  // 9. Deep Dive
  if (/\b(deep dive|ultimate guide|comprehensive guide|masterclass|in depth)\b/i.test(title)) {
    types.add('deep_dive');
  }

  // 10. News
  if (
    /\b(news|breaking news|update|announcement|press release|daily briefing|weekly recap)\b/i.test(
      title
    )
  ) {
    types.add('news');
  }

  // 11. Reaction
  if (/\b(reacts|reaction|reacting to)\b/i.test(title)) {
    types.add('reaction');
  }

  // 12. List & Compilation
  if (/\b(top\s*\d+|best\s*\d+|\d+\s*ways|\d+\s*tips|tier list|ranked|ranking)\b/i.test(title)) {
    types.add('list');
  }

  // 13. Vlog & Experience
  if (
    /\b(vlog|day in the life|my experience|living in|we visited|behind the scenes|travel vlog)\b/i.test(
      title
    )
  ) {
    types.add('vlog_experience');
  }

  // 14. Motivational
  if (
    /\b(motivational|inspiration|mindset|discipline|speech|advice for|stop wasting time)\b/i.test(
      title
    )
  ) {
    types.add('motivational');
  }

  // 15. Entertainment
  if (/\b(funny moments|prank|comedy skit|fails compilation|parody)\b/i.test(title)) {
    types.add('entertainment');
  }

  // Fallback to 'other' if no confident type matches
  if (types.size === 0) {
    types.add('other');
  }

  return Array.from(types);
}
