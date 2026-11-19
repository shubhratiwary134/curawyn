# YouTube DOM Selectors & Resilience Guide

YouTube frequently changes its client markup, classes, and Polymer web components. YouTube Feed Control is engineered with a **resilient, fail-open selector architecture**.

---

## 1. Selector Registry (`src/content/selectors.ts`)

All card and metadata selectors live exclusively in `src/content/selectors.ts`. Never hardcode query selectors inside content scripts or pipeline logic.

Each entry is configured with priority fallbacks:

```ts
export const SELECTORS = {
  // Candidate cards covering classic polymer elements and modern view models
  cards: [
    'ytd-rich-item-renderer',       // Classic home grid items
    'ytd-video-renderer',           // Classic search / list items
    'ytd-compact-video-renderer',   // Classic watch related sidebar items
    'ytd-grid-video-renderer',      // Channel pages and playlists
    'yt-lockup-view-model',         // Modern 2024+ desktop lockup model
    '.ytp-ce-video',                // In-player end-screen suggestion
    '.ytp-ce-element'               // In-player end-screen element
  ],
  ...
};
```

---

## 2. Fail-Open Architecture (`health.ts`)

If YouTube updates their DOM and breaks card extraction:
- If ≥ 8 candidate cards are found on a `full` surface but 0 can be parsed:
  - `extractionBroken` is flagged.
  - The extension **fails open**: all cards are marked visible.
  - **Why**: Under-filtering is infinitely better than black-holing or completely blanking the user's YouTube feed.
  - A discreet health warning is shown in the extension popup and console.

---

## 3. How to Update Selectors

When YouTube modifies an element:
1. Open YouTube DevTools (`F12`), inspect a video recommendation card.
2. Check the container tag (e.g. `yt-lockup-view-model`, `ytd-rich-item-renderer`).
3. Add or update the selector in `src/content/selectors.ts`.
4. If the markup cannot be verified against live desktop YouTube markup at compile time, mark with `// UNVERIFIED`.
5. Run the test suite: `npm test`.
