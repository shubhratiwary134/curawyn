import { Decision, VideoMeta, Classification, Settings } from '../../types';
import { DiversitySessionState } from './diversitySession';

export async function evaluateDiversityStep(
  meta: VideoMeta,
  classification: Classification | null,
  settings: Settings,
  session: DiversitySessionState,
  getImpressionCount?: (videoId: string, windowHours: number) => Promise<number>,
  isSeen?: (videoId: string) => Promise<boolean> | boolean
): Promise<Decision | null> {
  const d = settings.diversity;

  // 1. Sticky check: if already accepted in this surface session, keep visible
  if (session.acceptedVideoIds.has(meta.videoId)) {
    return {
      action: 'show',
      reason: 'allowed',
      detail: 'sticky_session_accepted'
    };
  }

  // 2. Duplicate suppression
  if (d.dedupe && session.renderedVideoIds.has(meta.videoId)) {
    return {
      action: 'hide',
      reason: 'diversity_duplicate',
      detail: `Duplicate video ${meta.videoId} already rendered in session`
    };
  }

  // 3. Already watched suppression
  if (d.hideWatched) {
    if (meta.watchedPct !== null && meta.watchedPct >= d.watchedThresholdPct) {
      return {
        action: 'hide',
        reason: 'diversity_watched',
        detail: `Watched progress (${meta.watchedPct}%) >= threshold (${d.watchedThresholdPct}%)`
      };
    }

    if (isSeen) {
      const seen = await isSeen(meta.videoId);
      if (seen) {
        return {
          action: 'hide',
          reason: 'diversity_watched',
          detail: 'Video was previously opened/seen by user'
        };
      }
    }
  }

  // 4. Max per channel cap
  const channelKey = meta.channel
    ? meta.channel.channelId || meta.channel.handle || meta.channel.name
    : null;

  if (channelKey) {
    const currentChannelCount = session.channelVideoCounts.get(channelKey) || 0;
    if (currentChannelCount >= d.maxPerChannel) {
      return {
        action: 'hide',
        reason: 'diversity_channel_cap',
        detail: `Channel "${channelKey}" has reached limit (${d.maxPerChannel}) in session`
      };
    }
  }

  // 5. Subgenre repetition sliding window
  const subgenreId = classification?.subgenreId || null;
  if (subgenreId && d.subgenreWindow.w > 0 && d.subgenreWindow.k > 0) {
    const countInWindow = session.subgenreWindowQueue.filter((id) => id === subgenreId).length;
    if (countInWindow >= d.subgenreWindow.k) {
      return {
        action: 'hide',
        reason: 'diversity_subgenre_window',
        detail: `Subgenre "${subgenreId}" exceeded ${d.subgenreWindow.k} in last ${d.subgenreWindow.w} cards`
      };
    }
  }

  // 6. Recently shown impression window across sessions
  if (getImpressionCount && d.maxImpressions > 0 && d.windowHours > 0) {
    const impressions = await getImpressionCount(meta.videoId, d.windowHours);
    if (impressions >= d.maxImpressions) {
      return {
        action: 'hide',
        reason: 'diversity_impression_window',
        detail: `Video shown ${impressions} times in last ${d.windowHours}h (cap: ${d.maxImpressions})`
      };
    }
  }

  // Candidate passes all diversity filters! Record acceptance into session
  session.recordAcceptedCard(meta.videoId, channelKey, subgenreId, d.subgenreWindow.w);
  return null;
}
