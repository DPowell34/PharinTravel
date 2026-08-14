#!/usr/bin/env bash
# Destined 4 Destinations — twice-daily Notion sync (pull) + TravelJoy sync (push)
cd /opt/PharinTravel/server || exit 1
echo "===== SYNC START $(date -u '+%Y-%m-%d %H:%M:%S') UTC ====="
echo "[pull] Notion -> Postgres"
/usr/bin/node migrate_notion_to_pg.js
echo "[push] flagged trips -> TravelJoy"
/usr/bin/node push_sync.js
echo "===== SYNC DONE $(date -u '+%Y-%m-%d %H:%M:%S') UTC ====="
echo
