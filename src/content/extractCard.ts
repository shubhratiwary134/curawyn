import { VideoMeta, ChannelRef } from '../core/types';
import { SELECTORS } from './selectors';

/**
 * Parses time string (e.g., "12:34" or "1:02:30") into total seconds.
 */
export function parseDurationToSeconds(durationText: string): number | null {
  if (!durationText) return null;
  const cleaned = durationText.trim();
  const parts = cleaned.split(':').map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) return null;

  if (parts.length === 2) {
    // mm:ss
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // hh:mm:ss
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

/**
 * Extracts video ID from a URL string or path.
 */
export function extractVideoId(href: string): string | null {
  if (!href) return null;

  // Pattern 1: /watch?v=XYZ
  const watchMatch = href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Pattern 2: /shorts/XYZ
  const shortsMatch = href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // Pattern 3: direct 11-char ID in pathname (e.g. /XYZ)
  const directMatch = href.match(/\/([a-zA-Z0-9_-]{11})(?:[?&]|$)/);
  if (directMatch) return directMatch[1];

  return null;
}

/**
 * Extracts ChannelRef from a link element or href.
 */
export function extractChannelRef(cardEl: HTMLElement): ChannelRef | null {
  let linkEl: HTMLAnchorElement | null = null;
  for (const sel of SELECTORS.channelLinks) {
    const el = cardEl.querySelector(sel);
    if (el && el instanceof HTMLAnchorElement && el.getAttribute('href')) {
      linkEl = el;
      break;
    }
  }

  if (!linkEl) {
    return null;
  }

  const href = linkEl.getAttribute('href') || '';
  const rawName = linkEl.textContent?.trim() || '';

  let channelId = '';
  let handle: string | undefined;

  if (href.startsWith('/@')) {
    handle = href.slice(1).split('/')[0];
    channelId = handle; // Placeholder until resolved or known
  } else if (href.includes('/channel/')) {
    channelId = href.split('/channel/')[1].split('/')[0].split('?')[0];
  } else if (href.includes('/c/')) {
    handle = href.split('/c/')[1].split('/')[0];
    channelId = handle;
  } else if (href.includes('/user/')) {
    handle = href.split('/user/')[1].split('/')[0];
    channelId = handle;
  } else {
    channelId = href.replace(/^\//, '').split('/')[0];
  }

  return {
    channelId,
    handle,
    name: rawName || handle || channelId
  };
}

/**
 * Extracts metadata from a YouTube card DOM element.
 */
export function extractCardMeta(cardEl: HTMLElement): VideoMeta | null {
  // 1. Find video link and videoId
  let videoHref = '';
  for (const sel of SELECTORS.videoLinks) {
    const el = cardEl.querySelector(sel);
    if (el && el instanceof HTMLAnchorElement && el.getAttribute('href')) {
      videoHref = el.getAttribute('href') || '';
      break;
    }
  }

  if (!videoHref && cardEl instanceof HTMLAnchorElement && cardEl.getAttribute('href')) {
    videoHref = cardEl.getAttribute('href') || '';
  }

  const videoId = extractVideoId(videoHref);
  if (!videoId) {
    return null;
  }

  // 2. Extract Title
  let title = '';
  for (const sel of SELECTORS.titles) {
    const el = cardEl.querySelector(sel);
    if (el) {
      title = (el.textContent || el.getAttribute('title') || '').trim();
      if (title) break;
    }
  }
  if (!title) {
    title = cardEl.getAttribute('aria-label') || '';
  }

  // 3. Extract Channel
  const channel = extractChannelRef(cardEl);

  // 4. Check Shorts
  const isShort = videoHref.includes('/shorts/') || cardEl.querySelector('[aria-label="Shorts"]') !== null;

  // 5. Check Live and Premiere status
  let isLive = false;
  for (const sel of SELECTORS.liveBadges) {
    if (cardEl.querySelector(sel)) {
      isLive = true;
      break;
    }
  }
  if (!isLive && /live/i.test(cardEl.textContent || '') && cardEl.querySelector('.badge-style-type-live-now')) {
    isLive = true;
  }

  let isUpcoming = false;
  for (const sel of SELECTORS.premiereBadges) {
    if (cardEl.querySelector(sel)) {
      isUpcoming = true;
      break;
    }
  }

  // 6. Extract Duration
  let durationSec: number | null = null;
  if (!isLive && !isUpcoming) {
    for (const sel of SELECTORS.durationBadges) {
      const el = cardEl.querySelector(sel);
      if (el && el.textContent) {
        const parsed = parseDurationToSeconds(el.textContent);
        if (parsed !== null) {
          durationSec = parsed;
          break;
        }
      }
    }
  }

  // 7. Watched Progress Percentage
  let watchedPct: number | null = null;
  for (const sel of SELECTORS.progressBar) {
    const el = cardEl.querySelector(sel) as HTMLElement | null;
    if (el) {
      const widthStyle = el.style.width || '';
      const match = widthStyle.match(/(\d+(?:\.\d+)?)%/);
      if (match) {
        watchedPct = parseFloat(match[1]);
        break;
      }
    }
  }

  return {
    videoId,
    title,
    channel,
    durationSec,
    isShort,
    isLive,
    isUpcoming,
    watchedPct
  };
}
