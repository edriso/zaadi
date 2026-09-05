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
- Keep mobile first, white, spacious, Arabic RTL. One remembrance at a time.
- Use 100dvh with safe-area padding. Fit text only within safe readable bounds.
  User text zoom is limited and may require vertical scrolling. Never crop Arabic marks.
- Quran: Amiri Quran, regular weight, line-height >=2.5. No Arabic letter spacing.
- Keep browser pinch zoom available. Do not use user-scalable=no or maximum-scale.
- Swipe left = previous, swipe right = next in RTL; arrows and labels must agree.
  Vertical scroll, text selection, multitouch, controls and canceled gestures must not navigate.
- Every swipe action needs a visible button and a keyboard alternative. No invisible tap zones.
- Native dialog panels need a label, Escape/backdrop dismissal and focus restoration.
- Text size/location preferences may persist locally. Reading counts are session-only;
  revisiting a new occasion starts fresh. No external religious API at runtime.
- Keep dependencies purposeful, package lock checked in, scripts reproducible.

## Delivery

- Run npm run check, npm run build and the static-output check before publishing.
- Test timing boundaries, setting limits, gestures, invalid storage and source integrity.
- GitHub Pages uses Actions, a repository-aware base path and static output only.
  Do not register or publish this project on another hosting service.
- Commit coherent changes with imperative subjects and no AI signatures or co-author trailers.
- Never put credentials or local settings into Git. Report actual verification limits.
