# Verification — 2026-09-05

- Source researcher inspected the Arabic source pages and repetition contexts before
  data import. The pipeline verifies the pinned records and unmodified Quran corpus.
- Eleven focused tests pass: time-window boundaries, local city calculations, invalid
  stored settings, zoom bounds, swipe direction, ignored gestures, bounded navigation,
  narration suffixes, Quran ranges and unrestricted-count protection.
- The same tests pass with the process timezone changed to America/New_York; the Cairo
  calculation still selects morning from the same absolute instant.
- Strict TypeScript and lint pass. The only accessibility lint exceptions are the
  deliberately focusable, keyboard-scrollable reading region; it is not mislabelled
  as a button. It has visible arrow-button alternatives.
- Production static export succeeds with the repository base path /zaadi. Output
  validation checks Arabic/RTL metadata, the absence of zoom restrictions, local fonts,
  and referenced assets. Pages staging strips the physical repository directory while
  retaining URL prefixes, as required by GitHub Pages project hosting.
- Independent code review identified short-landscape clipping and a small timing-button
  touch target. Both are fixed with a short-screen scrolling fallback and a44px target.
- npm audit reported zero known vulnerabilities after updating the starter dependencies.

Not verified:

- Real browser/mobile-device gestures, screenshots, screen-reader behavior, and200% zoom.
  No browser automation surface was available in this session. Logic tests and CSS review
  are not a substitute for device testing.
- Optional WebMCP tools are feature-detected and do not affect ordinary readers. No
  supporting browser registry was available, so registration/state transitions are unverified.
- Source checking is not qualified scholarly review; the site does not claim that status.
