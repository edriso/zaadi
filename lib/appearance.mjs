export const STORAGE = 'zaadi:preferences:v1';

// Runs in <head>, before the first paint. Keep this function self-contained:
// the server serializes it as a small inline bootstrap, with no client bundle wait.
export function bootstrapAppearance(storageKey, fonts) {
  const root = document.documentElement;
  let fontReady = false,
    readerReady = false,
    settled = false;
  root.dataset.boot = 'loading';
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
    const theme = stored?.version === 1 ? stored.theme : 'light';
    root.dataset.theme =
      theme === 'dark' ||
      (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'dark'
        : 'light';
  } catch {
    root.dataset.theme = 'light';
  }
  const finish = (fallback = false) => {
    if (settled || (!fallback && (!fontReady || !readerReady))) return;
    settled = true;
    clearTimeout(deadline);
    window.removeEventListener('zaadi:ready', onReaderReady);
    if (!fontReady) root.dataset.fonts = 'fallback';
    root.dataset.boot = 'ready';
  };
  const onReaderReady = () => {
    readerReady = true;
    finish();
  };
  window.addEventListener('zaadi:ready', onReaderReady);
  // A failed font or script must never leave a blank or inaccessible page.
  const deadline = setTimeout(() => finish(true), 4000);
  if (!document.fonts) return;
  Promise.all(
    fonts.map((font) =>
      document.fonts.load(`400 24px "${font.family}"`, font.sample),
    ),
  )
    .then((results) => {
      if (results.some((result) => !result.length))
        throw new Error('Font unavailable');
      return document.fonts.ready;
    })
    .then(() => {
      fontReady = true;
      requestAnimationFrame(() => requestAnimationFrame(() => finish()));
    })
    .catch(() => {
      /* The bounded fallback keeps a single font for this visit. */
    });
}
