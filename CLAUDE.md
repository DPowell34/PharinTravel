# CLAUDE.md  PharinTravel / D4D Travel

This file orients Claude Code (or any agent) picking up this repo after a Cowork session
on 2026-08-13 that investigated and fixed a set of infra/security issues. Read this before
touching git history, .env, nginx config, or the security group -- several things here are
intentional or higher-risk than they look.

## What this project is

site/, dashboard/, server/ form a bridge between a marketing site + staff CRM dashboard
(Destined 4 Destinations, a travel agency) and Notion (originally) / Postgres (in production).
server/index.js is the Node/Express backend. See README.md for the original intended
architecture -- production has since diverged from it (see below).

## Where things actually run

- Production server: AWS EC2 i-088a1050030cac14d ("DPTC-Server 1"), us-east-2,
  18.188.169.126. This is a shared box -- it also hosts dpowelltc.com,
  romeobravo(s).net, planner.romeobravos.net, and two unrelated Node apps. Be careful
  with anything at the host level (nginx config, security groups, cron) -- changes can affect
  other projects.
- Docker stack: /opt/docker-stack/compose.yml + compose.prod.yml, services nginx,
  pharintravel, master-planner-sync, brandt. The pharintravel service bind-mounts
  /opt/PharinTravel directly into the container -- editing files on disk on the box
  instantly changes what's live, no deploy step.
- Database: RDS Postgres (pharintravel-pg....rds.amazonaws.com), not the local Postgres
  also running on the box (that belongs to a different project). Credential lives in
  /opt/PharinTravel/server/.env as DATABASE_URL.
- Domain: destined4destinations.com resolves via Route 53 straight to the EC2 box.
  GitHub Pages is NOT involved -- it was unpublished and its custom domain removed on
  2026-08-13 because it never actually served the site (DNS never pointed at Pages IPs).

## Git state as of 2026-08-13 -- read before doing anything with git

- origin/main on GitHub is the "aspirational" codebase. It does not match what's
  running in production, and hasn't for a while.
- The actual production code that was hand-edited directly on the box (bypassing git for
  ~13 commits' worth of history) has been committed and pushed to a separate branch:
  production-snapshot-20260813. It has not been merged into main. Review the diff
  before merging -- it's a large changeset (60+ files).
- The local checkout at /opt/PharinTravel on the EC2 box is still on its own local
  main, which is based on an old commit and has diverged from origin/main. Do not
  run git pull or git merge in that directory -- it's the live-mounted working tree for
  the running container, and a naive merge could break production or silently overwrite
  live-only code. If you need to sync it, branch off carefully and test before switching
  what's checked out there.
- gh is authenticated on the box as DPowell34 via a PAT (not OAuth device flow -- that
  failed twice in this session and was abandoned in favor of gh auth login --with-token).

## Known issues, deliberately left as-is

- dashboard/login.js contains hardcoded, personal-looking credentials
  (DPowell11/DeadPool1128, destined4destinations@gmail.com/Agent1038@@@). This is
  dead code -- /dashboard/login.js and /dashboard/login.html both 404 on the live
  site, so it's not currently exploitable. Still bad practice to have it in source control.
  Dave has deferred fixing this twice now -- don't "fix" it without asking.
- ADMIN_PASSWORD in production .env is Agent1038. This is the real credential
  gating /auth/login -> /Dashboard/ and /Admin/ on the live site. It was rotated to a
  strong random value during this session, then explicitly reverted back to Agent1038
  per Dave's direct instruction ("I need the password to remain Agent1038"). Do not rotate
  this again without asking first -- it's a known, accepted tradeoff, not an oversight.
- SESSION_SECRET was rotated to a strong random value and left that way (invisible to
  users, just invalidates old session cookies -- no reason to revert it).
- Leftover CNAME file at repo root from the original (non-functional) GitHub Pages
  setup. Harmless now that Pages is disabled. Fine to delete, just hasn't been done yet.

## What was hardened this session (all done, no action needed)

- RDS Postgres password rotated.
- SSH (22) restricted from 0.0.0.0/0 to Dave's IP + the AWS EC2 Instance Connect service
  range for us-east-2 (3.16.146.0/29).
- nginx version disclosure disabled (server_tokens off; via
  /opt/docker-stack/nginx/conf.d/00-server-tokens.conf).
- LDAP (389) closed entirely on security group sg-0c69356b449003d6b (launch-wizard-2) --
  confirmed unused, no replacement rule.
- GitHub Pages unpublished, custom domain removed, publishing source set to None.

## Where the full write-up lives

- pharintravel-drift-report.md and pharintravel-session-report.md (delivered to Dave
  outside this repo) have the full narrative of the investigation.
- Jira: KAN-76 (https://david-powell.atlassian.net/browse/KAN-76) in the "Destined 4
  Destination" project has the same report annotated for the record.
