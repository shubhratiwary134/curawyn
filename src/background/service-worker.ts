import { patchSettings } from '../platform/settingsStore';
import { extractVideoId } from '../content/extractCard';

const MENU_BLOCK_VIDEO = 'yfc_block_video';
const MENU_BLOCK_CHANNEL = 'yfc_block_channel';

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
});

function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_BLOCK_VIDEO,
      title: 'Block this video (YouTube Feed Control)',
      contexts: ['link'],
      targetUrlPatterns: ['*://*.youtube.com/watch*', '*://*.youtube.com/shorts*']
    });

    chrome.contextMenus.create({
      id: MENU_BLOCK_CHANNEL,
      title: 'Block this channel (YouTube Feed Control)',
      contexts: ['link'],
      targetUrlPatterns: [
        '*://*.youtube.com/@*',
        '*://*.youtube.com/channel/*',
        '*://*.youtube.com/c/*',
        '*://*.youtube.com/user/*'
      ]
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, _tab) => {
  const linkUrl = info.linkUrl;
  if (!linkUrl) return;

  if (info.menuItemId === MENU_BLOCK_VIDEO) {
    const videoId = extractVideoId(linkUrl);
    if (videoId) {
      await patchSettings((prev) => ({
        ...prev,
        blacklist: {
          ...prev.blacklist,
          videos: {
            ...prev.blacklist.videos,
            [videoId]: {
              title: linkUrl,
              addedAt: Date.now()
            }
          }
        }
      }));
      console.log(`[YFC] Blacklisted video via context menu: ${videoId}`);
    }
  } else if (info.menuItemId === MENU_BLOCK_CHANNEL) {
    try {
      const url = new URL(linkUrl);
      let channelId = '';
      let handle: string | undefined;

      if (url.pathname.startsWith('/@')) {
        handle = url.pathname.slice(1).split('/')[0];
        channelId = handle;
      } else if (url.pathname.includes('/channel/')) {
        channelId = url.pathname.split('/channel/')[1].split('/')[0];
      } else if (url.pathname.includes('/c/')) {
        handle = url.pathname.split('/c/')[1].split('/')[0];
        channelId = handle;
      }

      if (channelId) {
        await patchSettings((prev) => ({
          ...prev,
          blacklist: {
            ...prev.blacklist,
            channels: {
              ...prev.blacklist.channels,
              [channelId]: {
                channelId,
                handle,
                name: handle || channelId,
                addedAt: Date.now()
              }
            }
          }
        }));
        console.log(`[YFC] Blacklisted channel via context menu: ${channelId}`);
      }
    } catch (_e) {
      // Ignore URL parse error
    }
  }
});
