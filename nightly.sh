#!/usr/bin/env bash
# Destined 4 Destinations — nightly refresh (site + database)
#
# Runs at 00:00 local from cron. Two halves, in this order:
#   1. site  — pull the published front end from origin/main onto the box
#   2. data  — pull Notion into Postgres, push flagged trips to TravelJoy
#
# Site first, so if a code change and a data change land the same night the box
# is already running the newer code when the sync writes.
#
# Deliberately NOT a git pull or merge. /opt/PharinTravel is the live working
# tree, bind-mounted into the running container, and its local branch has
# diverged from origin/main. `git checkout origin/main -- <paths>` touches only
# the listed paths and leaves everything else alone. See CLAUDE.md.
#
# Install:
#   chmod +x /opt/PharinTravel/nightly.sh
#   crontab -e
#   0 0 * * * /opt/PharinTravel/nightly.sh >> /var/log/d4d-nightly.log 2>&1

set -uo pipefail

REPO=/opt/PharinTravel
LOG_PREFIX="[d4d-nightly]"

say() { echo "$LOG_PREFIX $(date -u '+%Y-%m-%d %H:%M:%S') UTC | $*"; }

say "===== START ====="

# ---------------------------------------------------------------- 1. site ---
cd "$REPO" || { say "FATAL: $REPO missing"; exit 1; }

BEFORE=$(git rev-parse --short HEAD 2>/dev/null || echo unknown)
if git fetch origin --quiet; then
  REMOTE=$(git rev-parse --short origin/main)
  # Only the paths that are actually served. server/ is included because the
  # API changes with the front end; node picks it up on the restart below.
  if git checkout origin/main -- site/ server/index.js server/schema.sql; then
    say "site: checked out origin/main ($REMOTE), local HEAD was $BEFORE"
  else
    say "WARN: checkout failed — leaving the box on its current files"
  fi
else
  say "WARN: git fetch failed — skipping the site refresh"
fi

# Restart only if the API actually changed. The HTML is bind-mounted and needs
# no restart; server/index.js is node and does.
if ! git diff --quiet HEAD -- server/index.js 2>/dev/null; then
  if command -v docker >/dev/null 2>&1; then
    say "server/index.js changed — restarting the pharintravel container"
    docker compose -f /opt/docker-stack/compose.yml -f /opt/docker-stack/compose.prod.yml \
      restart pharintravel || say "WARN: container restart failed"
  else
    say "WARN: server/index.js changed but docker is not on PATH — restart by hand"
  fi
else
  say "server/index.js unchanged — no restart needed"
fi

# ---------------------------------------------------------------- 2. data ---
cd "$REPO/server" || { say "FATAL: $REPO/server missing"; exit 1; }

say "data: Notion -> Postgres"
if /usr/bin/node migrate_notion_to_pg.js; then
  say "data: pull ok"
else
  say "WARN: Notion pull failed"
fi

say "data: flagged trips -> TravelJoy"
if /usr/bin/node push_sync.js; then
  say "data: push ok"
else
  say "WARN: TravelJoy push failed"
fi

say "===== DONE ====="
echo
