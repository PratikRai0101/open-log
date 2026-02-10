#!/usr/bin/env bash
# Stages all workspace changes and creates a conventional local commit
# Usage: ./scripts/assistant-commit.sh [message]
set -euo pipefail

MSG="$1"
if [ -z "$MSG" ]; then
  # Build a default conventional-style commit message
  TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  # List changed files to include briefly in the body
  FILES=$(git status --porcelain --untracked-files=normal | awk '{print $2}' | tr '\n' ' ')
  if [ -z "$FILES" ]; then
    echo "No changes to commit."
    exit 0
  fi
  MSG="chore(assistant): apply assistant edits ($TS)"
  BODY="Files changed: $FILES"
else
  BODY="Committed by assistant script"
fi

git add -A

# If there are no staged changes after add, exit
if git diff --cached --quiet; then
  echo "No staged changes to commit."
  exit 0
fi

git commit -m "$MSG" -m "$BODY"
echo "Committed: $MSG"

exit 0
