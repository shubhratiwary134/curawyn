import { Decision, VideoMeta, Settings, SurfaceId } from '../../types';

export function evaluateShortsStep(
  meta: VideoMeta,
  settings: Settings,
  surfaceId: SurfaceId
): Decision | null {
  if (!meta.isShort) {
    return null;
  }

  // If in search, only hide if shorts.hideInSearch is true
  if (surfaceId === 'search') {
    if (settings.shorts.hideInSearch) {
      return {
        action: 'hide',
        reason: 'shorts_blocked',
        detail: 'Shorts hidden in search'
      };
    }
    return null;
  }

  // Across all other surfaces, if blockAll is ON, hide
  if (settings.shorts.blockAll) {
    return {
      action: 'hide',
      reason: 'shorts_blocked',
      detail: 'Shorts globally blocked'
    };
  }

  return null;
}
