import shutil, datetime, sys

PATH = "/opt/PharinTravel/send_birthday_anniversary_emails.py"


def patch_file(path, replacements, label):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    ts = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    backup = f"{path}.bak.{ts}"
    shutil.copy(path, backup)
    for old, new in replacements:
        count = content.count(old)
        if count != 1:
            print(f"[{label}] ANCHOR NOT UNIQUE (count={count}) for snippet starting: {old[:80]!r}")
            sys.exit(1)
        content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[{label}] patched OK, backup at {backup}, new_size={len(content)}")


# ---------------------------------------------------------------------------
# 1. Env var block: add FORWARD_ADDRESS (CC / forwarding recipient)
# ---------------------------------------------------------------------------
OLD_ENV = '''GMAIL_ADDRESS = os.environ.get("GMAIL_ADDRESS", "destined4destinations@gmail.com")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")
DRY_RUN = os.environ.get("DRY_RUN") == "1"'''

NEW_ENV = '''GMAIL_ADDRESS = os.environ.get("GMAIL_ADDRESS", "destined4destinations@gmail.com")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")
FORWARD_ADDRESS = os.environ.get("FORWARD_ADDRESS", "destined4destinations@gmail.com")
DRY_RUN = os.environ.get("DRY_RUN") == "1"'''

# ---------------------------------------------------------------------------
# 2. Docstring: document the new optional var
# ---------------------------------------------------------------------------
OLD_DOC = '''Optional:
  DRY_RUN=1              If set, prints what WOULD be sent instead of
                         actually sending -- use this to test safely.
"""'''

NEW_DOC = '''Optional:
  DRY_RUN=1              If set, prints what WOULD be sent instead of
                         actually sending -- use this to test safely.
  FORWARD_ADDRESS         Every outgoing email is CC'd to this address too.
                         (defaults to destined4destinations@gmail.com)
"""'''

# ---------------------------------------------------------------------------
# 3. send_email: CC the forwarding address on every send
# ---------------------------------------------------------------------------
OLD_SEND = '''def send_email(to_address, subject, body):
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = GMAIL_ADDRESS
    msg["To"] = to_address

    context = ssl.create_default_context()
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls(context=context)
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_ADDRESS, [to_address], msg.as_string())'''

NEW_SEND = '''def send_email(to_address, subject, body):
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = GMAIL_ADDRESS
    msg["To"] = to_address
    recipients = [to_address]
    if FORWARD_ADDRESS and FORWARD_ADDRESS.lower() != to_address.lower():
        msg["Cc"] = FORWARD_ADDRESS
        recipients.append(FORWARD_ADDRESS)

    context = ssl.create_default_context()
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls(context=context)
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_ADDRESS, recipients, msg.as_string())'''

patch_file(PATH, [
    (OLD_ENV, NEW_ENV),
    (OLD_DOC, NEW_DOC),
    (OLD_SEND, NEW_SEND),
], "patch29-birthday-email-from-and-forward")
