# زادي — contributor rules

Read docs/content-policy.md before editing any remembrance text, count, or timing.
This is a small Arabic remembrance reader, not a fatwa service or a measure of faith.
Correctness, readable Arabic, and a quiet reading experience come first.

## Religious content

- Use simple Modern Standard Arabic and a respectful tone.
- Never type Quran into UI or content records. Resolve verse references from the pinned
  Tanzil corpus, preserving every character and its attribution/license.
- Verify exact hadith text, narrator, collection/number, authenticity, context, and count
  against an inspected trusted source. Never manufacture morning/evening variants.
- A count belongs to a specific narration and occasion. Never turn an unrestricted
  remembrance into a prescribed count. Do not infer the user's prayer is complete.
- Clearly separate the original text, editorial instructions, source labels, and timing
  suggestions. Never claim the collection is exhaustive or scholar-reviewed.
- Prayer calculations and clock heuristics are navigation aids, not religious rulings.
  Explain the fallback and offer manual selection. Do not silently infer a city.
- No points, streaks, badges, celebrations, music, images of people, accounts, or tracking.
  A count control reports the narrated repetitions; it does not score worship.

## App structure and interaction

- app/: static route/layout; components/reader/: reader, panels; content/: collection
  definitions; data/: source texts/corpus; lib/: pure logic; scripts/: checks; docs/: guides.
- Keep mobile first, spacious, Arabic RTL. Light mode starts white; offer dark and
  system themes using shared color tokens. One remembrance at a time.
- Use 100dvh with safe-area padding. Fit text only within safe readable bounds.
  User text zoom is limited and may require vertical scrolling. Never crop Arabic marks.
- Quran: Amiri Quran, regular weight, line-height >=2.5. No Arabic letter spacing.
- Keep browser pinch zoom available. Do not use user-scalable=no or maximum-scale.
- Right arrow/right swipe = next; left arrow/left swipe = previous (user preference).
  Place Next on the right and Previous on the left; icons and help must agree.
  Vertical scroll, text selection, multitouch, controls and canceled gestures must not navigate.
- The text is a labelled native button with a visible tap hint. Tap/click/Enter/Space
  records one repetition and advances only when its target is met. Unrestricted texts
  advance without inventing a count. The last card never wraps. Undo reverses a read
  and its automatic advance. Keep the text button stable so keyboard focus survives.
- Reject held keys, accidental rapid taps, long presses, selection and drags (including
  out-and-back drags) as read actions. Track tap movement separately from swipe intent.
- Every swipe action needs a visible button and a keyboard alternative. No invisible tap zones.
- Native dialog panels need a label, Escape/backdrop dismissal and focus restoration.
- Preload versioned local font subsets before revealing the reader. Restore theme in
  the head before first paint. Bound the loading gate and provide a stable fallback if
  fonts/scripts fail; never leave a blank page or swap in late fonts after fallback.
  Preserve no-JavaScript readability and respect reduced motion.
- Text size/location/theme preferences may persist locally. Reading counts are session-only;
  revisiting a new occasion starts fresh. No external religious API at runtime.
- Keep dependencies purposeful, package lock checked in, scripts reproducible.

## Delivery

- Run npm run check, npm run build and the static-output check before publishing.
- Test timing boundaries, setting limits, gestures, invalid storage and source integrity.
- GitHub Pages uses Actions, a repository-aware base path and static output only.
  Do not register or publish this project on another hosting service.
- Commit coherent changes with imperative subjects and no AI signatures or co-author trailers.
- Never put credentials or local settings into Git. Report actual verification limits.
