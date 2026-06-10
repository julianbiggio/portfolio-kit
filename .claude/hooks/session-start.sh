#!/bin/bash
# SessionStart hook — static site, no dependencies to install.
# Runs the smoke-test suite and surfaces the result so regressions
# (theme/lang detection, hero image sizing, external photo, broken refs) are caught early.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

if ! command -v node >/dev/null 2>&1; then
  echo "session-start: node not found — skipping smoke tests."
  exit 0
fi

echo "session-start: running portfolio smoke tests (test/checks.mjs)…"
node test/checks.mjs || echo "⚠️  session-start: some checks FAILED (see above) — review before pushing."
exit 0
