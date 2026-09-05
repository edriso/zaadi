# زادي

A quiet, mobile-first Arabic remembrance reader. One dhikr per screen, white surfaces,
generous space, local fonts, bounded text size, and sources for every text and count.

## Run

Node.js 22.13+ and npm. No keys, database or environment file required.

```sh
npm ci
npm run dev
npm run check
npm run build
npm run preview
```

The server prints its local URL. Preview serves the exported `out/` folder on port 4174.
For a production-like repository build and preview:

```sh
GITHUB_REPOSITORY=edriso/zaadi npm run build
BASE_PATH=/zaadi npm run preview
```

## Reading

- Opens a time-appropriate collection; direct `#morning`, `#evening`, `#prayer`,
  `#sleep`, and `#general` links override the automatic suggestion.
- Without a chosen city: explicitly approximate device-clock suggestions. Morning is
  04:00–12:00, evening 15:00–21:00, general remembrance otherwise.
- With a supported city: local Adhan.js calculations choose morning from Fajr to Dhuhr
  and evening from Asr to Isha. Other times choose general remembrance. These are
  navigation windows, not religious deadlines. Method and Asr convention are editable.
- After-prayer and bedtime collections are selected manually, never inferred from time.
- Swipe right for next / left for previous. Visible labelled arrow buttons and keyboard
  Left/Right are alternatives. Vertical scroll, selection and multitouch do not navigate.
- Tab moves through controls. Left/Right work from the page; Home/End jump to the first/last
  item and Enter counts when the text is focused. Escape closes panels and restores focus.
  Settings include an Arabic keyboard guide; shortcuts respect text selection and editing.
- Text fits between 18–42px at default size; user scale is 80–160%, with an absolute
  16px minimum. Large or long text scrolls. Short landscape windows allow page scrolling.
  Native browser zoom remains enabled.
- The counter follows the narrated count, has undo, and never advances automatically.
  A single-read label differs from prescribed repetition. Unrestricted dhikr has no target.
- Preferences stay in localStorage. Counts stay in memory only and reset when choosing
  a collection/reloading; they are not a daily total or proof of recitation.

## Content and structure

29 reading cards (16 morning, 15 evening; some cards belong to multiple collections) across five collections. This is a verified selection, not an exhaustive
book of adhkar. Text, attribution, authenticity and count context are stored separately.

```text
app/                  static page, layout, white responsive CSS
components/reader/    reader and native dialog panel
content/              collection definitions and generated reading cards
lib/                  pure timing/gesture/preferences logic and reader hooks
data/                 pinned Quran corpus, source research and checksums
scripts/              source checks, tests, Pages output preparation and local preview
docs/                 content policy, architecture and verification notes
public/               favicon, third-party notices and licenses
.github/workflows/    validation and GitHub Pages deployment
site.config.mjs       one repository-aware base-path definition
```

The generated Sites scaffold uses React, TypeScript, Vinext and Vite. Static export
requires no server after deployment. The requested hosting target is GitHub Pages;
no Sites project or other hosting account is created. Supplied shadcn packages/config
remain available; unused starter component source was removed. Added libraries are
Adhan.js, local Cairo/Amiri fonts, and the scaffold's Lucide icons.

## Evidence

Read [AGENTS.md](AGENTS.md) and [the content policy](docs/content-policy.md) before
editing texts, repetitions or timing. Qur'an is resolved from the unchanged Tanzil corpus.
Hadith texts and counts were checked against specific Sunnah.com, Dorar, and the Hisn al-Muslim author’s pages; the UI links
back to each narration and labels its grade. Do not alter variant wording while retaining
the old citation. Pinned sources are excluded from formatting.

`npm run check` verifies source digests, references, counts, timing boundaries, preferences,
gestures, TypeScript and lint. It cannot certify scholarly interpretation or substitute
for real-device visual testing. See [verification notes](docs/verification.md).

## GitHub Pages

Push to `main` runs `.github/workflows/pages.yml`: install, verify, build, upload `out/`,
and deploy through the `github-pages` environment. Pull requests run checks/build only.
Enable Pages → Source → GitHub Actions when setting up a fork. No deployment token is
stored in source: Actions uses its scoped built-in token.

`GITHUB_REPOSITORY` provides the repository base path automatically. A user/organization
root site gets `/`; a custom domain may set `BASE_PATH` to an empty string at build time.
Vinext emits repository-prefixed static paths; `prepare-output.mjs` stages their contents
as the Pages artifact root. `check-output.mjs` checks those links before deployment.

Original code and editorial text use [0BSD](LICENSE). Third-party terms are in [NOTICE](NOTICE).
