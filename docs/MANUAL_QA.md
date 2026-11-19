# Manual QA Verification Checklist

Follow this checklist to verify YouTube Feed Control on a live desktop Google Chrome browser against real YouTube (`https://www.youtube.com`).

---

## 1. Onboarding & Passthrough Mode
- [ ] Install unpacked extension in Chrome (`chrome://extensions/`).
- [ ] Verify Options page opens with the **Welcome to YouTube Feed Control** onboarding modal.
- [ ] While onboarding is open, navigate to YouTube: verify the feed is in **passthrough mode** (nothing is hidden or broken).
- [ ] Select initial genres (e.g. `Programming and Software`), set durations (5–60 min), keep Shorts blocked, and click **Complete Setup**.

## 2. Whitelist & Precedence Filtering
- [ ] On the Home feed (`/`), verify only videos matching whitelisted genres/subgenres are visible.
- [ ] Enable Developer Debug Overlay in Options: verify green outlines `[SHOW] allowed` on matching cards and red outlines `[HIDE]` on filtered cards with detailed reason codes.
- [ ] Navigate to a watch page (`/watch?v=...`): verify related video recommendations in the right sidebar are filtered according to the whitelist.

## 3. Complete Shorts Blocker
- [ ] On Home feed: verify all Shorts shelves (`ytd-reel-shelf-renderer`) are absent.
- [ ] In the left navigation guide & mini-guide: verify the "Shorts" tab item is absent.
- [ ] On channel pages (`/@...`): verify the "Shorts" sub-tab is hidden.
- [ ] Paste a direct Shorts link (e.g., `https://www.youtube.com/shorts/<id>`):
  - With default behavior: verify it automatically redirects to `https://www.youtube.com/watch?v=<id>`.
  - With "block fully" setting: verify the custom blocked interstitial renders, pausing video immediately.

## 4. Blacklist & Undo Flow
- [ ] Hover over any card on Home feed: verify the 3-dot hover action button appears in the top-right corner.
- [ ] Click "Block Video": verify the card immediately disappears without page reload.
- [ ] Verify the 6-second **"Blocked — Undo"** toast appears at the bottom-left. Click "Undo" and confirm the card reappears immediately.
- [ ] Block a channel: verify all cards from that channel vanish from the feed.
- [ ] Try opening a blocked video URL directly in the browser address bar: verify the blocked interstitial is displayed and playback is muted and paused.

## 5. Diversity Engine
- [ ] On Home feed, scroll down through 5+ batches of recommendations.
- [ ] Inspect the channel names: verify no channel has more than 2 visible videos across the entire session.
- [ ] Check watched videos (videos with red progress bar ≥ 20%): verify they are suppressed from recommendations.

## 6. Search Unrestricted & Channel Pages
- [ ] Perform any search query on `/results`: verify all search results appear untouched by default.
- [ ] Visit a creator's channel page (`/@.../videos`): verify video grid is visible, and only blacklisted channels/videos are hidden (`blacklistOnly` surface mode).

## 7. Infinite Scroll & Continuation
- [ ] Configure strict filters (e.g. only 1 niche subgenre enabled).
- [ ] Scroll down: verify that despite many cards being hidden, the continuation nudger triggers YouTube to load additional recommendations.
- [ ] If 0 cards match out of available recommendations, verify the **"All videos here were filtered"** banner appears with "Adjust Filters" and "Show Unfiltered Once" buttons.
