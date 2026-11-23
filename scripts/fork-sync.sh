#!/usr/bin/env bash
# Fork autonomo: merge the latest upstream release tag into `autonomo`,
# reinstall deps, run the fork's tests + typecheck and push.
# Usage: scripts/fork-sync.sh [tag]   (default: newest upstream v* tag)
set -euo pipefail
cd "$(dirname "$0")/.."

git fetch -q upstream --tags
tag="${1:-$(git tag -l 'v*' --sort=-v:refname | head -1)}"
if git merge-base --is-ancestor "$tag" HEAD; then
	echo "autonomo ya incluye $tag; nada que hacer."
	exit 0
fi

echo "Mergeando $tag en autonomo…"
git checkout -q autonomo
if ! git merge --no-edit "$tag"; then
	echo "Conflictos al mergear $tag. Resolvelos (o pedile al agente) y corré:"
	echo "  git add -A && git commit --no-edit && scripts/fork-sync.sh"
	exit 1
fi

pnpm install --frozen-lockfile --ignore-scripts
GENTLE_PI_UNATTENDED=0 node --experimental-strip-types --test \
	tests/unattended.test.ts tests/yolo-session-policy.test.ts \
	tests/odd-routing-contract.test.ts tests/always-on-prompt-verdicts-contract.test.ts \
	tests/foreign-target-grants.test.ts tests/session-messaging-grants.test.ts \
	tests/orchestrator-helper-consent.test.ts
pnpm -s typecheck

# Verify every unattended hook survived the merge.
grep -q 'unattendedEnabled()' extensions/gentle-ai.ts
grep -q 'unattendedEnabled()' extensions/gentle-agents.ts
grep -q 'unattendedEnabled()' lib/foreign-target-grants.ts
grep -q 'unattendedEnabled()' lib/session-messaging-grants.ts
grep -q 'unattendedEnabled()' lib/orchestrator-helper-consent.ts
grep -q 'Unattended delivery' assets/orchestrator.md
grep -q 'privatePathsAllowed' extensions/gentle-ai.ts

git push -q origin autonomo
echo "Listo: autonomo = $tag + parches. Reiniciá Pi para cargarlo."
