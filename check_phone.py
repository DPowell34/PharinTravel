import os, json, urllib.request

NOTION_KEY = os.environ["NOTION_API_KEY"]
CLIENTS_DB = os.environ["NOTION_CLIENTS_DB_ID"]

cursor = None
while True:
    body = {"page_size": 100}
    if cursor:
        body["start_cursor"] = cursor
    req = urllib.request.Request(
        f"https://api.notion.com/v1/databases/{CLIENTS_DB}/query",
        data=json.dumps(body).encode(),
        method="POST",
    )
    req.add_header("Authorization", "Bearer " + NOTION_KEY)
    req.add_header("Notion-Version", "2022-06-28")
    req.add_header("Content-Type", "application/json")
    r = json.loads(urllib.request.urlopen(req).read())

    for p in r["results"]:
        title = p["properties"]["Name"]["title"]
        if not title:
            continue
        name = tit