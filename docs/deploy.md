# Deploy

The project ships as a fully static site on GitHub Pages from the `docs/` directory of the
`main` branch.

## One-time setup

1. Create the repo `baditaflorin/audience-field-sculpture`.
2. In **Settings → Pages**, set **Source** = "Deploy from a branch", **Branch** = `main`,
   **Folder** = `/docs`.

That is the entire setup. No GitHub Actions, no deploy workflow.

## Day-to-day flow

Build is **local-only**. GitHub Pages serves whatever `docs/` content is in the latest
commit on `main`; nothing builds on GitHub.

```bash
# 1. make changes under src/, public/, tests/, etc.
# 2. validate locally — pre-commit will run lint/typecheck/test anyway
npm run smoke

# 3. stage everything, including the freshly built docs/
git add -A
git commit -m "feat: ..."

# 4. push. Pages re-serves the new docs/ within a minute or two.
git push
```

The Husky pre-commit hook (`.husky/pre-commit`) gates every commit on
`lint + typecheck + test`. Running `npm run smoke` first is a habit, not a hard requirement.

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

The build is committed to `main`, so rollback is `git revert` of the offending commit +
push. Pages re-serves the previous content within a minute or two.

## Why no CI workflow

We deliberately do not maintain a `.github/workflows/` pipeline for this repo. The
acceptance gate (`lint + typecheck + test`) runs locally in the pre-commit hook, and the
Pages source is whatever `docs/` is in the commit being pushed. GitHub Pages itself is
free; GitHub Actions runs against a billed minute budget that this project does not pay
into.
