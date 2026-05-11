// GitHub Pages 404 fallback that redirects unknown sub-paths to the app root.
// Useful when the app is opened via a stale deep link.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);
const indexPath = `${root}/docs/index.html`;
const indexHtml = readFileSync(indexPath, 'utf8');

mkdirSync(`${root}/docs`, { recursive: true });
writeFileSync(`${root}/docs/404.html`, indexHtml);
