#!/bin/bash
cd /opt/PharinTravel
set -a
. server/.env
set +a
/usr/bin/python3 send_birthday_anniversary_emails.py >> /var/log/d4d-bday-anniv.log 2>&1
