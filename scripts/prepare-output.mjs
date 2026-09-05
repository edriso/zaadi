import { basePath } from '../site.config.mjs';
import { cpSync, existsSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base = basePath;
assert.ok(
  base === '' || /^\/[A-Za-z0-9._-]+$/.test(base),
  'Base path must be one safe repository segment',
);
const source = `dist/client${base}`;
assert.ok(
  existsSync(`${source}/index.html`),
  'Missing prerendered entry point',
);
rmSync('out', { recursive: true, force: true });
mkdirSync('out');
cpSync(source, 'out', { recursive: true });
if (base && existsSync('dist/client/404.html'))
  cpSync('dist/client/404.html', 'out/404.html');
writeFileSync('out/.nojekyll', '');
console.log('Prepared GitHub Pages artifact in out/.');
