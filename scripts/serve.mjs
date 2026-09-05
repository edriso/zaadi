import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
const root = resolve('out'),
  port = Number(process.env.PORT || 4174),
  base = process.env.BASE_PATH || '';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
};
createServer((request, response) => {
  let path;
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    );
    if (base && !pathname.startsWith(`${base}/`)) {
      response.writeHead(404).end();
      return;
    }
    path = resolve(root, `.${pathname.slice(base.length)}`);
    if (!path.startsWith(`${root}/`) && path !== root) {
      response.writeHead(403).end();
      return;
    }
    if (existsSync(path) && statSync(path).isDirectory())
      path = resolve(path, 'index.html');
    if (!existsSync(path)) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.setHeader(
      'Content-Type',
      mime[extname(path)] || 'application/octet-stream',
    );
    response.end(readFileSync(path));
  } catch {
    response.writeHead(400).end();
  }
}).listen(port, '127.0.0.1', () =>
  console.log(`Static preview: http://localhost:${port}${base}/`),
);
