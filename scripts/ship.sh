#!/usr/bin/env bash
set -euo pipefail

# One-shot patch release.
#
# Commits pending work (if any), bumps the patch version, pushes commits + tag,
# then cuts a GitHub release. The release triggers .github/workflows/publish.yml,
# which runs the actual `npm publish`. Nothing is published from this machine.
#
# Usage: bun run ship ["commit message"]

cd "$(dirname "$0")/.."

msg="${1:-chore: release}"

git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit — releasing current HEAD."
else
  git commit -m "$msg"
fi

# npm version bumps package.json, creates the release commit, and tags v<x.y.z>.
# It prints the new tag (e.g. v0.1.7) on stdout — reuse it so the GitHub release
# targets exactly the tag that was just created.
tag="$(npm version patch)"

git push
git push --tags

gh release create "$tag" --generate-notes
