# Deploy

The project ships as a fully static site on GitHub Pages from the `docs/` directory of the
`main` branch.

## One-time setup

1. Create the repo `baditaflorin/audience-field-sculpture`.
2. In **Settings → Pages**, set **Source** = "Deploy from a branch", **Branch** = `main`,
   **Folder** = `/docs`.
3. The custom workflow `.github/workflows/deploy.yml` runs `npm run build` and commits the
   refreshed `docs/` back to `main` whenever non-doc source changes land.

## Local preview of the published build

```bash
npm run pages-preview
# serves docs/ at http://127.0.0.1:4173/audience-field-sculpture/
```

This mirrors the base path GitHub Pages uses so relative URLs resolve identically.

## Build pipeline (`npm run build`)

```
prepare-pages-dir.mjs   ← clears stale build artifacts in docs/ but preserves hand-authored
                          docs (ADRs, audits, postmortem, architecture.md, deploy.md).
tsc -b                  ← typechecks src/ and tests/.
vite build              ← emits docs/index.html, docs/assets/*.js, docs/assets/*.css,
                          and copies public/ verbatim (icon.svg, privacy.html, tags/).
write-version.mjs       ← writes docs/version.json with commit + builtAt.
copy-404.mjs            ← duplicates index.html as docs/404.html so deep links fall back to
                          the app.
check-pages-build.mjs   ← sanity-checks the build (must contain index.html, 404.html,
                          version.json, icon.svg, tags/printable.html, and a hashed JS
                          bundle reference).
```

## Versioning

- `package.json` is the source of truth for the version string.
- Bump to the next minor (`0.1.0 → 0.2.0`) at the close of each Phase pass.
- Tag the commit (`v0.1.0`) after the build is green.
- `docs/version.json` is regenerated from the latest git metadata each build.

## Rollback

The build is committed to `main`, so rollback is `git revert` of the publish commit + push.
Pages re-serves the previous content within a minute or two.
