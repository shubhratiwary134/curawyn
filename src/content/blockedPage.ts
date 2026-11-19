import { Settings } from '../core/types';
import { patchSettings } from '../platform/settingsStore';
import { extractVideoId } from './extractCard';

export function checkDirectBlockedUrl(settings: Settings, urlStr: string = window.location.href): boolean {
  if (!settings.enabled || !settings.onboardingDone) return false;

  try {
    const url = new URL(urlStr);
    const path = url.pathname;

    // 1. Direct Video URL (/watch?v=...)
    if (path.startsWith('/watch')) {
      const videoId = extractVideoId(url.search);
      if (videoId && settings.blacklist.videos[videoId]) {
        showBlockedInterstitial({
          type: 'video',
          id: videoId,
          title: settings.blacklist.videos[videoId].title,
          settings
        });
        return true;
      }
    }

    // 2. Direct Channel URL (/@handle or /channel/UC...)
    if (path.startsWith('/@') || path.startsWith('/channel/')) {
      for (const [chId, chRef] of Object.entries(settings.blacklist.channels)) {
        if (
          (chRef.handle && path.startsWith(`/@${chRef.handle}`)) ||
          path.includes(chId)
        ) {
          showBlockedInterstitial({
            type: 'channel',
            id: chId,
            title: chRef.name || chRef.handle || chId,
            settings
          });
          return true;
        }
      }
    }
  } catch (_e) {
    // Ignore URL parse error
  }

  return false;
}

export function showBlockedInterstitial(params: {
  type: 'video' | 'channel';
  id: string;
  title: string;
  settings: Settings;
}): void {
  // Pause and mute player immediately
  const pauseVideos = () => {
    document.querySelectorAll('video').forEach((v) => {
      v.pause();
      v.muted = true;
    });
  };
  pauseVideos();
  window.addEventListener('play', pauseVideos, true);

  if (document.getElementById('yfc-blocked-interstitial')) return;

  const overlay = document.createElement('div');
  overlay.id = 'yfc-blocked-interstitial';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = '#0b0b0b';
  overlay.style.color = '#ffffff';
  overlay.style.zIndex = '2147483647';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  overlay.innerHTML = `
    <div style="background-color: #181818; border: 1px solid #333; border-radius: 8px; padding: 32px; max-width: 500px; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
      <div style="font-size: 32px; margin-bottom: 12px;">🚫</div>
      <h2 style="color: #ff4444; margin: 0 0 8px 0; font-size: 20px;">Blocked by YouTube Feed Control</h2>
      <p style="color: #ccc; margin: 0 0 16px 0; font-size: 14px;">
        This ${params.type} is on your hard blacklist:
      </p>
      <div style="background-color: #222; padding: 10px 14px; border-radius: 4px; font-weight: bold; margin-bottom: 24px; word-break: break-all; font-size: 13px;">
        "${params.title}"
      </div>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="yfc-blocked-back-btn" style="padding: 10px 20px; background-color: #333; color: #fff; border: 1px solid #555; border-radius: 4px; cursor: pointer; font-size: 14px;">
          Go Back
        </button>
        <button id="yfc-blocked-unblock-btn" style="padding: 10px 20px; background-color: #cc0000; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px;">
          Unblock ${params.type === 'video' ? 'Video' : 'Channel'}
        </button>
      </div>
    </div>
  `;

  (document.body || document.documentElement).appendChild(overlay);

  document.getElementById('yfc-blocked-back-btn')?.addEventListener('click', () => {
    window.history.back();
  });

  document.getElementById('yfc-blocked-unblock-btn')?.addEventListener('click', async () => {
    if (params.type === 'video') {
      await patchSettings((prev) => {
        const nextVideos = { ...prev.blacklist.videos };
        delete nextVideos[params.id];
        return {
          ...prev,
          blacklist: { ...prev.blacklist, videos: nextVideos }
        };
      });
    } else {
      await patchSettings((prev) => {
        const nextChannels = { ...prev.blacklist.channels };
        delete nextChannels[params.id];
        return {
          ...prev,
          blacklist: { ...prev.blacklist, channels: nextChannels }
        };
      });
    }
    overlay.remove();
    window.location.reload();
  });
}
