// Clears Vite build artifacts from docs/ before each build while preserving
// hand-authored docs (ADRs, postmortems, phase3 audits, privacy, deploy, etc.).
// docs/ is BOTH the Pages publishing source and the location for project docs.
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const docsDir = new URL('../docs/', import.meta.url);
const docsPath = docsDir.pathname;

const removableFiles = ['index.html', '404.html', 'version.json', 'icon.svg'];

for (const file of removableFiles) {
  const target = join(docsPath, file);
  if (existsSync(target)) rmSync(target, { force: true });
}

const assetsDir = join(docsPath, 'assets');
if (existsSync(assetsDir) && statSync(assetsDir).isDirectory()) {
  rmSync(assetsDir, { recursive: true, force: true });
}

const tagsBuildDir = join(docsPath, 'tags-build');
if (existsSync(tagsBuildDir) && statSync(tagsBuildDir).isDirectory()) {
  rmSync(tagsBuildDir, { recursive: true, force: true });
}

if (existsSync(docsPath)) {
  for (const entry of readdirSync(docsPath)) {
    if (entry.endsWith('.js.map') || entry.endsWith('.css.map')) {
      rmSync(join(docsPath, entry), { force: true });
    }
  }
}
