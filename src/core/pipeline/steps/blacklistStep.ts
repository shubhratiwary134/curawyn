import { Decision, VideoMeta, Classification, Settings } from '../../types';

export function evaluateBlacklistStep(
  meta: VideoMeta,
  classification: Classification | null,
  settings: Settings
): Decision | null {
  const bl = settings.blacklist;

  // 1. Video Blacklist
  if (meta.videoId && bl.videos[meta.videoId]) {
    return {
      action: 'hide',
      reason: 'blacklist_video',
      detail: `Video ${meta.videoId} is blacklisted: "${bl.videos[meta.videoId].title}"`
    };
  }

  // 2. Channel Blacklist (match channelId or handle)
  if (meta.channel) {
    const chId = meta.channel.channelId;
    const handle = meta.channel.handle;

    if (chId && bl.channels[chId]) {
      return {
        action: 'hide',
        reason: 'blacklist_channel',
        detail: `Channel ${meta.channel.name} (${chId}) is blacklisted`
      };
    }

    if (handle && bl.channels[handle]) {
      return {
        action: 'hide',
        reason: 'blacklist_channel',
        detail: `Channel handle @${handle} is blacklisted`
      };
    }
  }

  // 3. Genre / Subgenre Hard Block (blocked flag)
  if (classification) {
    if (classification.subgenreId) {
      const sub = settings.subgenres[classification.subgenreId];
      if (sub && sub.blocked) {
        return {
          action: 'hide',
          reason: 'blacklist_subgenre',
          detail: `Subgenre "${sub.name}" is hard blocked`
        };
      }
    }

    if (classification.genreId) {
      const g = settings.genres[classification.genreId];
      if (g && g.blocked) {
        return {
          action: 'hide',
          reason: 'blacklist_genre',
          detail: `Genre "${g.name}" is hard blocked`
        };
      }
    }
  }

  return null;
}
