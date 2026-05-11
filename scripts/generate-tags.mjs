// Generates a printable HTML page of ArUco markers (ARUCO_MIP_36h12) and an
// app icon SVG, using js-aruco2's built-in generateSVG(). The output is
// committed at public/tags/printable.html so it ships with the build and works
// offline. js-aruco2 uses CommonJS, so we require() it here.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { AR } = require('js-aruco2');

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);

const dictName = 'ARUCO_MIP_36h12';
const dictionary = new AR.Dictionary(dictName);

const ids = [0, 1, 2, 3, 4, 5, 6, 7];
const svgs = ids.map((id) => ({ id, svg: dictionary.generateSVG(id) }));

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Printable sculpture tags — Audience Field Sculpture</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 1.5rem; color: #111; background: #fff; }
  h1 { font-size: 1.25rem; margin-top: 0; }
  p { max-width: 40rem; line-height: 1.5; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; }
  .tag { border: 1px solid #ddd; padding: 1rem; border-radius: 0.5rem; text-align: center; break-inside: avoid; }
  .tag svg { width: 100%; height: auto; max-width: 200px; image-rendering: pixelated; }
  .tag .id { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin-top: 0.5rem; font-size: 0.95rem; }
  .tag .scale { color: #666; font-size: 0.8rem; }
  .back { color: #2563eb; }
  @media print {
    .no-print { display: none; }
    .tag { border-color: transparent; }
  }
</style>
</head>
<body>
<p class="no-print"><a class="back" href="../">← Back to the artwork</a></p>
<h1>Printable sculpture tags</h1>
<p class="no-print">
  Print this page at <strong>100% scale</strong>. Each marker should measure
  about <strong>8&nbsp;cm</strong> across after printing on A4 or US Letter.
  Mount one near the sculpture, then point a phone running the artwork at it.
  Dictionary: <code>${dictName}</code>.
</p>
<p class="no-print">
  In the artwork menu, set <em>Expected tag ID</em> to the number under the
  marker you used. The default ID is <code>0</code>.
</p>
<div class="grid">
${svgs
  .map(
    ({ id, svg }) => `  <div class="tag">
    ${svg}
    <div class="id">id ${id}</div>
    <div class="scale">≈ 8 cm at 100% print</div>
  </div>`
  )
  .join('\n')}
</div>
</body>
</html>
`;

const outDir = `${root}/public/tags`;
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/printable.html`, html);

// App icon: the smallest marker, rendered standalone.
const iconSvg = dictionary.generateSVG(0);
writeFileSync(`${root}/public/icon.svg`, iconSvg);

console.info(`Wrote ${outDir}/printable.html with ${ids.length} markers and public/icon.svg.`);
