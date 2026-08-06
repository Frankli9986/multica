#!/usr/bin/env bash
#
# The runtime roster used to be repeated five times in each README, so adding a
# provider meant ten edits and the lists silently drifted (MUL-5812: `deveco`,
# `grok`, `qwen`, and `qwenpaw` were all missing). Each README now lists the
# roster exactly once, between the runtimes markers, and this check keeps those
# two tables identical to scripts/agent-cli-command-names.txt.
#
# Usage: scripts/check-readme-runtimes.sh

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_of_truth="$repo_root/scripts/agent-cli-command-names.txt"
readmes=("README.md" "README.zh-CN.md")

if [ ! -f "$source_of_truth" ]; then
  echo "error: missing $source_of_truth" >&2
  exit 1
fi

# Strip blanks and comments, then sort so the comparison ignores file order.
expected="$(grep -vE '^\s*(#|$)' "$source_of_truth" | tr -d '\r' | sort -u)"

status=0

for readme in "${readmes[@]}"; do
  path="$repo_root/$readme"

  if [ ! -f "$path" ]; then
    echo "error: missing $readme" >&2
    status=1
    continue
  fi

  if ! grep -q '<!-- runtimes:start -->' "$path" || ! grep -q '<!-- runtimes:end -->' "$path"; then
    echo "error: $readme is missing the <!-- runtimes:start --> / <!-- runtimes:end --> markers" >&2
    status=1
    continue
  fi

  # Take the marked block, keep the table rows, and read the CLI command out of
  # each row's backticks. Rows without a backticked command (the header and the
  # `| --- |` separator) drop out here.
  actual="$(
    sed -n '/<!-- runtimes:start -->/,/<!-- runtimes:end -->/p' "$path" |
      grep -oE '`[a-z0-9][a-z0-9-]*`' |
      tr -d '`' |
      sort -u
  )"

  if [ "$actual" = "$expected" ]; then
    count="$(printf '%s\n' "$expected" | wc -l | tr -d ' ')"
    echo "ok: $readme lists all $count runtimes"
    continue
  fi

  status=1
  echo "error: the runtime table in $readme does not match scripts/agent-cli-command-names.txt" >&2

  missing="$(comm -23 <(printf '%s\n' "$expected") <(printf '%s\n' "$actual") || true)"
  extra="$(comm -13 <(printf '%s\n' "$expected") <(printf '%s\n' "$actual") || true)"

  if [ -n "$missing" ]; then
    echo "  missing from $readme (add a row for each):" >&2
    printf '    %s\n' $missing >&2
  fi
  if [ -n "$extra" ]; then
    echo "  listed in $readme but not a known agent CLI (remove, or add it to the source of truth):" >&2
    printf '    %s\n' $extra >&2
  fi
done

if [ "$status" -ne 0 ]; then
  echo >&2
  echo "The roster lives in one table per README. Update both tables and rerun:" >&2
  echo "  scripts/check-readme-runtimes.sh" >&2
fi

exit "$status"
