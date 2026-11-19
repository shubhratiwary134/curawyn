import { Decision, VideoMeta, Settings } from '../../types';

export function evaluateLiveStep(meta: VideoMeta, settings: Settings): Decision | null {
  if (meta.isLive || meta.isUpcoming) {
    if (settings.global.liveStreams === 'block') {
      return {
        action: 'hide',
        reason: 'live_blocked',
        detail: meta.isLive ? 'Live streams are blocked' : 'Upcoming premieres are blocked'
      };
    }
  }
  return null;
}
