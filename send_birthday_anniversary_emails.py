#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Daily automation: check the Notion Clients database for birthdays and
anniversaries falling TODAY, and send each matching client the
Birthday / Anniversary email template from destined4destinations@gmail.com.

This mirrors the same date logic used by the "Next 30 Days" calendar on the
d4dtravel.app dashboard (Marketing > Calendar) -- it just queries Notion
directly instead of reading the rendered page, which is more robust for an
unattended server job.

Run this once a day (e.g. via cron) -- see the suggested crontab line at
the bottom of this file.

Required environment variables (set these in the server's .env or the
cron environment -- do NOT hardcode them in this file):

  NOTION_API_KEY        Notion internal integration token
                         (already used elsewhere on this server)
  NOTION_CLIENTS_DB_ID   Notion Clients database ID
  GMAIL_ADDRESS          Sending Gmail address
                         (defaults to destined4destinations@gmail.com)
  GMAIL_APP_PASSWORD     A Gmail App Password for that account -- NOT the
                         normal account password. Generate one at
                         https://myaccount.google.com/apppasswords
                         (requires 2-Step Verification to be turned on).

Optional:
  DRY_RUN=1              If set, prints what WOULD be sent instead of
                         actually sending -- use this to test safely.
  FORWARD_ADDRESS         Every outgoing email is CC'd to this address too.
                         (defaults to destined4destinations@gmail.com)
"""

import os
import json
import smtplib
import ssl
import urllib.request
from datetime import date
from email.mime.text import MIMEText
from email.utils import formataddr

NOTION_KEY = os.environ["NOTION_API_KEY"]
CLIENTS_DB = os.environ["NOTION_CLIENTS_DB_ID"]
ACTIVITIES_DB = os.environ.get("NOTION_ACTIVITIES_DB_ID")
NOTION_VERSION = "2022-06-28"

GMAIL_ADDRESS = os.environ.get("GMAIL_ADDRESS", "destined4destinations@gmail.com")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")
# GMAIL_DISPLAY_NAME: friendly name shown before the address in most inboxes,
# e.g. "Destined 4 Destinations <d4dtravel1@gmail.com>". This matches the
# "Send mail as" identity already configured in Gmail's own settings.
GMAIL_DISPLAY_NAME = os.environ.get("GMAIL_DISPLAY_NAME", "Destined 4 Destinations")
# GMAIL_REPLY_TO: where a client's reply actually goes if they hit Reply.
# Matches the Reply-To already configured in Gmail's "Send mail as" settings.
GMAIL_REPLY_TO = os.environ.get("GMAIL_REPLY_TO", "destined4destinations@gmail.com")
FORWARD_ADDRESS = os.environ.get("FORWARD_ADDRESS", "destined4destinations@gmail.com")
DRY_RUN = os.environ.get("DRY_RUN") == "1"

# ---------------------------------------------------------------------------
# Email templates -- kept in sync with the Templates > Emails tab on the
# dashboard. If you edit the copy there, update it here too.
# ---------------------------------------------------------------------------
BIRTHDAY_SUBJECT = "Happy Birthday, {first_name}! \U0001F382"
BIRTHDAY_BODY = """Hi {first_name},

Wishing you the happiest of birthdays! I hope your day is filled with all your favorite things and a little extra celebration.

If a birthday getaway — or just some well-deserved time to dream about your next trip — sounds like the perfect gift to yourself this year, I'd love to help you plan it. Just reply to this email and let's talk destinations.

Have a wonderful birthday!

Warmly,
Pharin Walker
Owner & Travel Advisor, Destined 4 Destinations"""

ANNIVERSARY_SUBJECT = "Happy Anniversary, {first_name}! \U0001F942"
ANNIVERSARY_BODY = """Hi {first_name},

Happy Anniversary! I hope today is filled with celebration and all the little moments that remind you why you fell in love in the first place.

If you've been dreaming about a trip to celebrate — whether it's revisiting somewhere special or exploring somewhere brand new — I'd love to help you plan it. Anniversary trips are some of my favorite trips to put together.

Wishing you many more years of love and adventure together.

Warmly,
Pharin Walker
Owner & Travel Advisor, Destined 4 Destinations"""


def notion_request(method, path, body=None):
    url = "https://api.notion.com" + path
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "Bearer " + NOTION_KEY)
    req.add_header("Notion-Version", NOTION_VERSION)
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def load_clients():
    """Paginate through the Notion Clients DB and return name/email/dates."""
    clients = []
    cursor = None
    while True:
        body = {"page_size": 100}
        if cursor:
            body["start_cursor"] = cursor
        result = notion_request("POST", f"/v1/databases/{CLIENTS_DB}/query", body)
        for page in result.get("results", []):
            props = page.get("properties", {})
            title = props.get("Name", {}).get("title", [])
            name = "".join(t.get("plain_text", "") for t in title).strip()
            email_prop = props.get("Email", {}).get("email")
            dob = props.get("Date of Birth", {}).get("date")
            anniv = props.get("Anniversary", {}).get("date")
            clients.append({
                "id": page["id"],
                "name": name,
                "first_name": name.split(" ")[0] if name else "there",
                "email": email_prop,
                "date_of_birth": dob["start"] if dob else None,
                "anniversary": anniv["start"] if anniv else None,
            })
        if result.get("has_more"):
            cursor = result.get("next_cursor")
        else:
            break
    return clients


def is_today(iso_date_str, today):
    """True if iso_date_str's month/day matches today's month/day (any year)."""
    if not iso_date_str:
        return False
    try:
        parts = iso_date_str.split("-")
        m, d = int(parts[1]), int(parts[2][:2])
        return m == today.month and d == today.day
    except (ValueError, IndexError):
        return False


def flag_missing_email(client_name, client_id, event, today):
    """Create a Notion Task flagging a client with no email on file who had
    a birthday/anniversary match today, so it surfaces on the dashboard's
    Tasks panel for manual follow-up."""
    if not ACTIVITIES_DB:
        return
    properties = {
        "Name": {"title": [{"text": {"content": f"Missing email on file \u2014 {client_name} ({event})"}}]},
        "Due Date": {"date": {"start": today.isoformat()}},
        "Notes": {"rich_text": [{"text": {"content": f"{event.capitalize()} matched today but no email on file, so the automated {event} email could not be sent. Add an email address to this client's profile to enable outreach."}}]},
        "Done": {"checkbox": False},
    }
    if client_id:
        properties["Client"] = {"relation": [{"id": client_id}]}
    try:
        notion_request("POST", "/v1/pages", {"parent": {"database_id": ACTIVITIES_DB}, "properties": properties})
    except Exception as exc:
        print(f"  (warning: could not create follow-up task for {client_name}: {exc})")


def send_email(to_address, subject, body):
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = formataddr((GMAIL_DISPLAY_NAME, GMAIL_ADDRESS))
    if GMAIL_REPLY_TO:
        msg["Reply-To"] = GMAIL_REPLY_TO
    msg["To"] = to_address
    recipients = [to_address]
    if FORWARD_ADDRESS and FORWARD_ADDRESS.lower() != to_address.lower():
        msg["Cc"] = FORWARD_ADDRESS
        recipients.append(FORWARD_ADDRESS)

    context = ssl.create_default_context()
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls(context=context)
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_ADDRESS, recipients, msg.as_string())


def main():
    if not DRY_RUN and not GMAIL_APP_PASSWORD:
        raise SystemExit(
            "GMAIL_APP_PASSWORD is not set. Set it as an environment variable, "
            "or run with DRY_RUN=1 to preview without sending."
        )

    target_date_str = os.environ.get("TARGET_DATE")
    today = date.fromisoformat(target_date_str) if target_date_str else date.today()
    clients = load_clients()
    print(f"Loaded {len(clients)} clients. Checking for matches on {today.isoformat()}...")

    sent = 0
    skipped_no_email = []

    for c in clients:
        events = []
        if is_today(c["date_of_birth"], today):
            events.append("birthday")
        if is_today(c["anniversary"], today):
            events.append("anniversary")

        for event in events:
            if not c["email"]:
                skipped_no_email.append((c["name"], event))
                if not DRY_RUN:
                    flag_missing_email(c["name"], c["id"], event, today)
                continue

            if event == "birthday":
                subject = BIRTHDAY_SUBJECT.format(first_name=c["first_name"])
                body = BIRTHDAY_BODY.format(first_name=c["first_name"])
            else:
                subject = ANNIVERSARY_SUBJECT.format(first_name=c["first_name"])
                body = ANNIVERSARY_BODY.format(first_name=c["first_name"])

            if DRY_RUN:
                print(f"[DRY RUN] Would send {event} email to {c['name']} <{c['email']}> — subject: {subject}")
            else:
                send_email(c["email"], subject, body)
                print(f"Sent {event} email to {c['name']} <{c['email']}>")
            sent += 1

    print(f"Done. {'Would have sent' if DRY_RUN else 'Sent'} {sent} email(s).")
    if skipped_no_email:
        print("Skipped (no email on file):")
        for name, event in skipped_no_email:
            print(f"  {name} ({event})")


if __name__ == "__main__":
    main()

# ---------------------------------------------------------------------------
# Suggested cron schedule (runs once daily at 8:00 AM server time):
#
#   0 8 * * * cd /opt/PharinTravel && /usr/bin/python3 send_birthday_anniversary_emails.py >> /var/log/d4d-bday-anniv.log 2>&1
#
# Add via `crontab -e`. Make sure NOTION_API_KEY, NOTION_CLIENTS_DB_ID,
# GMAIL_ADDRESS, and GMAIL_APP_PASSWORD are available in the environment
# cron runs in -- e.g. wrap the command with `env $(cat /opt/PharinTravel/.env | xargs)`
# or source the .env file at the top of a small wrapper shell script.
# ---------------------------------------------------------------------------
