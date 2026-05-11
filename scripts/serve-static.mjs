// Minimal static server for previewing the Pages build locally.
// Mounts the given directory at the project's GitHub Pages base path
// so internal URLs (e.g. /audience-field-sculpture/assets/...) resolve.
import { createReadStream, statSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const dir = resolve(process.cwd(), process.argv[2] ?? 'docs');
const base = '/audience-field-sculpture';
const port = Number(process.env.PORT ?? 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

createServer((req, res) => {
  let url = req.url ?? '/';
  if (url.startsWith(base)) url = url.slice(base.length) || '/';
  let path = join(dir, decodeURIComponent(url.split('?')[0]));
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
  if (!existsSync(path)) {
    res.statusCode = 404;
    res.end('not found');
    return;
  }
  res.setHeader('content-type', types[extname(path)] ?? 'application/octet-stream');
  createReadStream(path).pipe(res);
}).listen(port, () => {
  console.info(`Static preview at http://127.0.0.1:${port}${base}/`);
});
