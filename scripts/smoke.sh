#!/usr/bin/env bash
# Smoke test: every command runs in CI and locally before publishing the build.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ npm run typecheck"
npm run typecheck

echo "→ npm run lint"
npm run lint

echo "→ npm run test"
npm run test

echo "→ npm run build"
npm run build

echo "✓ smoke passed"
