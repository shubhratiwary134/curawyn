import { Decision, VideoMeta, Classification, Settings } from '../../types';
import { resolveDuration } from '../../resolve/duration';

export function evaluateDurationStep(
  meta: VideoMeta,
  classification: Classification | null,
  settings: Settings
): Decision | null {
  // Live streams and premieres have no duration, duration rules are skipped for them
  if (meta.isLive || meta.isUpcoming) {
    return null;
  }

  if (meta.durationSec === null) {
    return null;
  }

  const subgenre = classification?.subgenreId
    ? settings.subgenres[classification.subgenreId] || null
    : null;
  const genre = classification?.genreId ? settings.genres[classification.genreId] || null : null;

  const resolved = resolveDuration(subgenre, genre, settings.global.duration);
  const { minSec, maxSec } = resolved.value;

  if (minSec !== null && meta.durationSec < minSec) {
    return {
      action: 'hide',
      reason: 'duration_limit',
      detail: `Duration (${meta.durationSec}s) is shorter than minimum allowed (${minSec}s)`
    };
  }

  if (maxSec !== null && meta.durationSec > maxSec) {
    return {
      action: 'hide',
      reason: 'duration_limit',
      detail: `Duration (${meta.durationSec}s) exceeds maximum allowed (${maxSec}s)`
    };
  }

  return null;
}
