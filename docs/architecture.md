# Architecture

A single static page exported with Vinext/React/TypeScript. No runtime server or API.
GitHub Pages serves generated HTML and local assets. The first screen is the reader.
A hash identifies the chosen collection, so browser Back and shared links work without
SPA rewrite rules. The collection list, bounded text size settings, and sources are
native dialog panels. There is no marketing page, account, or backend.

## Decisions

- The viewport has header, flexible reading area, and bottom navigation. Only the
  reading area scrolls when the text cannot fit within readable font-size bounds.
- Versioned font subsets are preloaded in the head. A small bootstrap restores the
  selected theme and waits for fonts and reader initialization before showing the app.
  A four-second deadline reveals a stable fallback if fonts fail, or static content if
  hydration fails. No-JavaScript readers are never hidden by this gate.
- Text is measured after local fonts load and on container resize. User zoom multiplies
  that fitted size and is clamped; vertical overflow is intentional at larger sizes.
- Prayer calculation is local; civil-clock suggestions are marked approximate.
- Time is resolved on opening a collection/returning from a background tab, but an active
  reading is never interrupted by an automatic collection change.
- A pure reading reducer makes counting and auto-advance atomic. Undo reverses both.
  Pointer movement guards separate deliberate text taps from scroll, drag and swipe.
  The text button remains mounted across cards, preserving keyboard focus.
- Preferences use defensive, versioned localStorage access. Counts are memory-only and
  reset when switching collections or explicitly restarting them.
- Each source and count is verified offline at build time against pinned records.

## Milestones

1. Source research and content schema; reader and navigation rules.
2. Viewport reader, settings, local timing, repeat controls and collection picker.
3. Focused logic checks, production/static validation and GitHub Pages workflow.
