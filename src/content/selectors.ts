/**
 * Registry of YouTube DOM Selectors.
 * Every selector that could not be verified against live YouTube markup in this environment
 * is marked with `// UNVERIFIED`.
 */

export const SELECTORS = {
  // Candidate video cards in feeds and lists
  cards: [
    'ytd-rich-item-renderer', // Verified standard home feed item
    'ytd-video-renderer', // Verified standard search / list item
    'ytd-compact-video-renderer', // Verified watch page related item
    'ytd-grid-video-renderer', // Verified channel / grid item
    'yt-lockup-view-model', // UNVERIFIED newer YouTube desktop custom element
    '.ytp-ce-video', // Verified in-player endscreen card
    '.ytp-ce-element' // Verified in-player endscreen element
  ],

  // Title extraction fallbacks inside a card
  titles: [
    '#video-title', // Verified standard title element
    '#video-title-link', // UNVERIFIED alternative title link
    '.yt-lockup-metadata-view-model__title', // UNVERIFIED newer lockup title class
    'h3 a', // Fallback standard link inside heading
    'a#thumbnail[title]' // Title stored in thumbnail tooltip
  ],

  // Video Link extraction (for videoId and Shorts detection)
  videoLinks: [
    'a#thumbnail', // Verified primary thumbnail link
    'a#video-title', // Verified title link
    'a.yt-lockup-view-model__content-image', // UNVERIFIED lockup thumbnail link
    'a[href*="/watch?v="]', // Universal watch link fallback
    'a[href*="/shorts/"]' // Universal shorts link fallback
  ],

  // Channel link & name extraction
  channelLinks: [
    'ytd-channel-name a', // Verified primary channel name link
    '#channel-name a', // Verified fallback channel link
    '#owner-name a', // UNVERIFIED watch page owner link
    '.yt-lockup-metadata-view-model__subtitle a', // UNVERIFIED lockup subtitle link
    'a[href^="/@"]', // Universal handle link fallback
    'a[href^="/channel/"]', // Universal UC channel link fallback
    'a[href^="/c/"]', // Universal custom channel link fallback
    'a[href^="/user/"]' // Universal legacy user link fallback
  ],

  // Duration badges
  durationBadges: [
    'ytd-thumbnail-overlay-time-status-renderer span#text', // Verified legacy overlay time
    'span.ytd-thumbnail-overlay-time-status-renderer', // Verified alternate overlay span
    '.yt-badge-shape__label', // UNVERIFIED newer badge shape label
    'badge-shape .yt-core-attributed-string', // UNVERIFIED newer core badge string
    '#overlays ytd-thumbnail-overlay-time-status-renderer' // Fallback overlay container
  ],

  // Live / Premiere status indicators
  liveBadges: [
    '[aria-label="LIVE"]', // Verified aria label for live
    '.badge-style-type-live-now', // Verified legacy live badge class
    'ytd-badge-supported-renderer [aria-label*="LIVE"]', // UNVERIFIED badge wrapper
    '.yt-badge-shape__label--live' // UNVERIFIED newer badge live modifier
  ],

  // Premiere indicators
  premiereBadges: [
    '[aria-label*="Premiere"]', // Verified premiere label
    'ytd-badge-supported-renderer [aria-label*="PREMIERE"]', // UNVERIFIED badge wrapper
    '.badge-style-type-premiere' // UNVERIFIED premiere class
  ],

  // Watched progress bar
  progressBar: [
    '#progress', // Verified thumbnail resume progress bar
    'ytd-thumbnail-overlay-resume-playback-renderer #progress', // Verified full selector
    '.yt-thumbnail-overlay-resume-playback-renderer__progress' // UNVERIFIED lockup progress class
  ],

  // Shorts shelves & entry points
  shortsShelves: [
    'ytd-reel-shelf-renderer', // Verified standard Shorts shelf
    'ytd-rich-shelf-renderer[is-shorts]', // Verified rich shelf Shorts container
    'ytd-rich-section-renderer:has(ytd-reel-shelf-renderer)', // Modern CSS container
    'ytd-rich-section-renderer:has([is-shorts])' // Modern CSS rich section
  ],

  // Shorts Guide items in sidebar & navigation
  shortsGuideItems: [
    'ytd-guide-entry-renderer a[title="Shorts"]', // Verified guide entry
    'ytd-mini-guide-entry-renderer[aria-label="Shorts"]', // Verified mini guide entry
    'ytd-guide-entry-renderer a[href^="/shorts"]', // Verified href fallback
    'ytd-mini-guide-entry-renderer a[href^="/shorts"]', // Verified mini guide href fallback
    'yt-tab-shape[tab-title="Shorts"]', // UNVERIFIED channel page shorts tab
    'tp-yt-paper-tab:has(div[title="Shorts"])' // UNVERIFIED legacy channel shorts tab
  ],

  // Containers for infinite scroll / continuation
  feedContainers: [
    'ytd-rich-grid-renderer #contents', // Verified home feed contents container
    'ytd-section-list-renderer #contents', // Verified subscriptions / explore container
    'ytd-watch-next-secondary-results-renderer #items', // Verified watch sidebar items
    '#secondary-inner #contents' // UNVERIFIED watch sidebar secondary inner
  ]
};
