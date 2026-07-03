#!/usr/bin/env bash
set -euo pipefail

# ── Check for uncommitted or unpushed changes ────────────────────────────────
warning=""

if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    warning="You have uncommitted changes in your local repository."
fi

if git status -sb 2>/dev/null | grep -qE 'ahead [[:digit:]]+'; then
    if [[ -n "$warning" ]]; then
        warning+=$'\n'
    fi
    warning+="You have unpushed commits in your local repository."
fi

# ── Warn and confirm ─────────────────────────────────────────────────────────
if [[ -n "$warning" ]]; then
    echo "WARNING: $warning" >&2
    read -r -p "Do you want to continue anyway? (y/n) " answer
    if [[ ! "$answer" =~ ^[yY](es)?$ ]]; then
        echo "Update aborted."
        exit 0
    fi
fi

# ── Remote update, install & build ──────────────────────────────────────────
echo "Connecting to moodle server..."

ssh jonathan@moodle bash <<'REMOTE'
    set -euo pipefail

    echo "Pulling latest changes..."
    cd /var/www/moodle/mod/hypervideo
    git pull personal main

    echo "Installing npm dependencies..."
    cd vue
    npm install

    echo "Building Vue frontend..."
    npm run build

    echo "Purging Moodle caches..."
    cd /var/www/moodle
    php admin/cli/purge_caches.php

    echo "Done."
REMOTE

echo "Update completed successfully."