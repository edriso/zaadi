# Verification — 2026-09-05

- Source researcher inspected the Arabic source pages and repetition contexts before
  data import. The pipeline verifies the pinned records and unmodified Quran corpus.
- Twenty-one focused tests pass: time-window boundaries, local city calculations, invalid
  stored settings, zoom bounds, swipe direction, ignored gestures, bounded navigation,
  narration suffixes, Quran ranges, unrestricted-count protection, keyboard guards, and
  exact allowlisted source destinations, theme migration, atomic count/advance/undo,
  tap intent, and font-loading/failure gates.
- The original timing tests also passed with the process timezone changed to America/New_York; the Cairo
  calculation still selects morning from the same absolute instant.
- Strict TypeScript and lint pass. The only accessibility lint exceptions are the
  deliberately focusable, keyboard-scrollable reading region; it is not mislabelled
  as a button. It has visible arrow-button alternatives.
- Production static export succeeds with the repository base path /zaadi. Output
  validation checks Arabic/RTL metadata, the absence of zoom restrictions, local fonts,
  and referenced assets. Pages staging strips the physical repository directory while
  retaining URL prefixes, as required by GitHub Pages project hosting.
- Independent code review identified short-landscape clipping and a small timing-button
  touch target. Both are fixed with a short-screen scrolling fallback and a 44px target.
- npm audit reported zero known vulnerabilities after updating the starter dependencies.

- Desktop Brave UI verification: arrow navigation from initial page focus, Enter adds
  one reading, End reaches the last item without wrapping, settings isolate shortcuts,
  and Escape restores focus to the settings trigger. The expanded evening collection
  reaches 15 items; its final text fits the desktop reading area, and its source panel
  displays the expected Muslim reference and single-reading explanation.
- Expanded to 16 morning and 15 evening cards with inspected timing/count evidence.
  Source variants and deferred candidates are recorded in data/sources.json.

- New appearance/interaction checks in the production export: dark mode persists on
  refresh; the reader and settings have consistent dark surfaces and readable text.
  Clicking text advances single readings; Enter/Space count all three repetitions
  before advancing and preserve focus. Undo restores the prior card/count. Right
  advances and Left returns, including after undo.
- At 390×844 in Brave device emulation: the long opening prayer fits; a rightward
  touch swipe advances without counting, a text tap records exactly one repetition,
  and a vertical gesture leaves the count and card unchanged.
- First-paint tests simulate slow/failed fonts, late font completion, malformed or denied
  storage, and missing reader initialization. Static checks verify the three font preloads
  and app icon. Refresh was visually inspected; no network-throttled filmstrip was captured.

Not verified:

- Mobile-device gestures, screen-reader behavior, and 200% zoom.
  Desktop UI was available for keyboard checks; these checks are not a substitute for
  mobile-device or assistive-technology testing.
- Optional WebMCP tools are feature-detected and do not affect ordinary readers. No
  supporting browser registry was available, so registration/state transitions are unverified.
- Source checking is not qualified scholarly review; the site does not claim that status.
