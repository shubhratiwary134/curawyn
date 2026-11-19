import { Classification, VideoMeta, Settings } from '../types';
import { scoreSubgenres } from './keywordScorer';
import { detectContentTypes } from './contentTypeDetector';

export function classifyVideo(meta: VideoMeta, settings: Settings): Classification {
  // 1. Video Override
  if (meta.videoId && settings.overrides.videos[meta.videoId]) {
    const ov = settings.overrides.videos[meta.videoId];
    const sub = settings.subgenres[ov.subgenreId];
    return {
      subgenreId: ov.subgenreId,
      genreId: sub?.genreId,
      contentTypes: ov.contentTypes || detectContentTypes(meta),
      confidence: 1.0,
      source: 'override'
    };
  }

  // 2. Channel Override
  const channelKey = meta.channel?.channelId || meta.channel?.handle;
  if (channelKey && settings.overrides.channels[channelKey]) {
    const ov = settings.overrides.channels[channelKey];
    const sub = settings.subgenres[ov.subgenreId];
    return {
      subgenreId: ov.subgenreId,
      genreId: sub?.genreId,
      contentTypes: ov.contentTypes || detectContentTypes(meta),
      confidence: 1.0,
      source: 'override'
    };
  }

  // 3. Keyword Scoring Rules
  const scored = scoreSubgenres(meta, settings);
  const contentTypes = detectContentTypes(meta);

  if (scored.topSubgenre) {
    return {
      genreId: scored.genreId,
      subgenreId: scored.subgenreId,
      contentTypes,
      confidence: scored.confidence,
      source: 'rules'
    };
  }

  return {
    contentTypes,
    confidence: 0,
    source: 'none'
  };
}
