#!/usr/bin/env python3
"""
Adds a small "Updated: <Month YYYY>" meta line + dateModified JSON-LD to each
guide page, and injects a visible stamp inside the article header.
Idempotent: skips pages already containing data-lagoon-updated.
"""
from pathlib import Path
import re, datetime

ROOT = Path(__file__).resolve().parent.parent
SLUGS = [p.name for p in ROOT.iterdir()
         if p.is_dir() and (p / "index.html").exists()
         and p.name not in {"node_modules", "web", "output", ".claude",
                             "scripts", "company", "guides"}]

today = datetime.date.today()
human = today.strftime("%B %Y")          # e.g. "May 2026"
iso = today.isoformat()                  # 2026-05-14

STAMP = (
    f'<p class="updated-stamp" data-lagoon-updated '
    f'style="font-size:13px;color:#62594F;margin:8px 0 0;font-family:'
    "'Space Mono'"
    f',monospace">Updated: {human}</p>'
)

LD = (
    '<script type="application/ld+json" data-lagoon-updated-ld>\n'
    '{ "@context":"https://schema.org","@type":"Article",'
    f'"dateModified":"{iso}",'
    '"publisher":{"@type":"Organization","name":"Lagoon"}}\n'
    '</script>\n'
)

for slug in SLUGS:
    p = ROOT / slug / "index.html"
    html = p.read_text()
    if "data-lagoon-updated" in html:
        print(f"skip: {slug}"); continue
    # Inject JSON-LD into <head>
    html = html.replace("</head>", LD + "</head>", 1)
    # Visible stamp: try inserting after the first <h1>...</h1>
    m = re.search(r"</h1>", html)
    if m:
        html = html[:m.end()] + "\n        " + STAMP + html[m.end():]
    p.write_text(html)
    print(f"ok: {slug}")
