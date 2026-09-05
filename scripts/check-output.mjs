import { basePath } from '../site.config.mjs';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
const directory = 'out';
assert.ok(
  existsSync(`${directory}/index.html`),
  'Missing static export dist/client/index.html',
);
const base = basePath;
const html = readFileSync(`${directory}/index.html`, 'utf8');
assert.ok(html.includes('lang="ar"') && html.includes('dir="rtl"'));
assert.ok(html.includes('زادي'));
assert.ok(
  !html.includes('user-scalable=no') && !html.includes('maximum-scale=1'),
  'Do not disable browser zoom',
);
assert.ok(html.includes('/zaadi-icon.svg'), 'Missing Zaadi tab icon');
assert.equal(
  [...html.matchAll(/as="font"/g)].length,
  3,
  'Preload each local font subset',
);
assert.ok(
  html.includes('zaadi:ready') && html.includes('font-display:block'),
  'Missing first-paint font gate',
);
const files = [];
const walk = (path) => {
  for (const name of readdirSync(path, { withFileTypes: true })) {
    const next = join(path, name.name);
    if (name.isDirectory()) walk(next);
    else files.push(next);
  }
};
walk(directory);
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  const url = match[1].replace(/&amp;/g, '&');
  if (!url.startsWith('/') || url.startsWith('//')) continue;
  assert.ok(
    !base || url.startsWith(`${base}/`),
    `Asset ignores Pages base: ${url}`,
  );
  const path = url.slice(base.length).split('?')[0];
  assert.ok(
    existsSync(resolve(directory, `.${path}`)),
    `Missing output asset: ${url}`,
  );
}
assert.ok(
  files.some((file) => file.endsWith('.woff2')),
  'Fonts must be hosted locally',
);
console.log(
  `Verified static export (${files.length} files), RTL, local fonts and base path ${base || '/'}.`,
);

for (const file of files.filter((file) => file.endsWith('.css'))) {
  const css = readFileSync(file, 'utf8');
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    const url = match[1];
    if (url.startsWith('data:') || /^https?:/.test(url)) continue;
    const path = url.startsWith('/')
      ? resolve(directory, `.${url.slice(base.length)}`)
      : resolve(file, '..', url);
    assert.ok(existsSync(path), `Missing CSS font/asset: ${url}`);
  }
}
