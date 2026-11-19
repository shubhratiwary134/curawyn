# Architectural Decisions & Assumptions

This document records the architectural decisions and domain assumptions applied in YouTube Feed Control MVP in accordance with the specification.

---

## 1. Surface Modes
- **Subscriptions Feed (`/feed/subscriptions`)**: Default mode is set to `full` to allow filtering subscription overload by duration, content type, and subgenres. Users can switch this to `blacklistOnly` or `bypass` in Advanced settings.
- **Channel Pages & Playlists (`/@...`, `/playlist`)**: Default mode is set to `blacklistOnly`. When a user deliberately visits a creator's channel or playlist, they expect to browse that creator's content without whitelist truncation. Hard exclusions (blacklisted videos/channels) remain strictly enforced.
- **Search Results (`/results`)**: Search results are in `bypass` mode (unrestricted by default). An optional toggle `blacklist.applyInSearch` enables hard blacklists in search results.

---

## 2. Multi-Label Classification Resolution
- When a video scores above the confidence threshold across multiple subgenres:
  - Whitelist check passes if **ANY** detected subgenre with confidence ≥ threshold is whitelisted and **NONE** is blocked.
  - Duration and content-type rules are derived from the highest-confidence allowed subgenre.
  - If a video matches a genre with confidence ≥ threshold but no single subgenre reaches threshold, it is treated as a genre-level match and allowed if the parent genre is enabled and unblocked.

---

## 3. Direct Shorts Navigation
- Default behavior for direct navigation to `/shorts/<id>` is `redirect` to `/watch?v=<id>`, allowing users to view the content in YouTube's standard, full-featured player with controls rather than the addictive TikTok-style vertical reel.
- Users can switch this in settings to `block` to show a full-page blocked interstitial.

---

## 4. Reversible DOM Hiding vs Removal
- Hiding uses CSS attribute selectors (`[data-yfc-state="hidden"] { display: none !important; }`) rather than removing DOM nodes.
- **Benefits**:
  - Toggling settings (e.g. enabling a genre or clicking Undo) restores cards instantly without network re-fetches.
  - YouTube's internal Polymer state machine and virtual scroll renderers remain uncorrupted.

---

## 5. Fail-Open Extraction Health
- If YouTube updates markup causing candidate cards to be found but none to be parseable:
  - The extension flags `extractionBroken` and **fails open** (marks cards visible).
  - Silent over-blocking or black-holing an empty feed is a catastrophic failure mode. Failing open preserves user usability until selectors are updated.
