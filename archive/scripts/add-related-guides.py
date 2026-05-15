#!/usr/bin/env python3
"""
Inject a "Related guides" block into each guide page before the </main> tag.
Idempotent: if the block already exists (data-lagoon-related), skip the page.

Topic groups drive which related links each page gets — 5 contextually-relevant
links per page, biased toward sibling intent.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

# slug -> human title
TITLES = {
    "best-apps-for-ucsb-students": "Best apps for UCSB students",
    "best-dorms-at-ucsb": "Best dorms at UCSB",
    "best-study-spots-at-ucsb": "Best study spots at UCSB",
    "how-lagoon-dining-works": "How Lagoon dining works",
    "how-lagoon-schedule-works": "How Lagoon schedule works",
    "how-to-choose-classes-at-ucsb": "How to choose classes at UCSB",
    "how-to-meet-people-at-ucsb": "How to meet people at UCSB",
    "how-to-plan-your-ucsb-schedule": "How to plan your UCSB schedule",
    "how-to-use-gold-at-ucsb": "How to use GOLD at UCSB",
    "isla-vista-guide-for-students": "Isla Vista guide for students",
    "ucsb-campus-events-guide": "UCSB campus events guide",
    "ucsb-dining-menu": "UCSB dining menu guide",
    "ucsb-dorm-faq": "UCSB dorm FAQ",
    "ucsb-finals-week-guide": "UCSB finals week guide",
    "ucsb-first-week-guide": "UCSB first week guide",
    "ucsb-freshman-faq": "UCSB freshman FAQ",
    "ucsb-ge-requirements-guide": "UCSB GE requirements guide",
    "ucsb-grade-distributions-guide": "UCSB grade distributions guide",
    "ucsb-meal-plan-guide": "UCSB meal plan guide",
    "ucsb-move-in-checklist": "UCSB move-in checklist",
    "ucsb-orientation-checklist": "UCSB orientation checklist",
    "ucsb-registration-guide": "UCSB registration guide",
    "ucsb-transfer-student-guide": "UCSB transfer student guide",
    "what-to-bring-to-ucsb-dorm": "What to bring to a UCSB dorm",
    "what-to-do-between-classes-at-ucsb": "What to do between classes at UCSB",
}

# Topic clusters (used to pick siblings)
CLUSTERS = {
    "dining": ["ucsb-dining-menu", "ucsb-meal-plan-guide", "how-lagoon-dining-works"],
    "classes": ["how-to-choose-classes-at-ucsb", "how-to-plan-your-ucsb-schedule",
                "how-to-use-gold-at-ucsb", "ucsb-registration-guide",
                "ucsb-grade-distributions-guide", "ucsb-ge-requirements-guide",
                "how-lagoon-schedule-works"],
    "housing": ["best-dorms-at-ucsb", "ucsb-dorm-faq", "what-to-bring-to-ucsb-dorm",
                "ucsb-move-in-checklist"],
    "onboarding": ["ucsb-first-week-guide", "ucsb-orientation-checklist",
                   "ucsb-freshman-faq", "ucsb-transfer-student-guide",
                   "ucsb-move-in-checklist"],
    "campus_life": ["ucsb-campus-events-guide", "best-study-spots-at-ucsb",
                    "what-to-do-between-classes-at-ucsb", "how-to-meet-people-at-ucsb",
                    "isla-vista-guide-for-students", "ucsb-finals-week-guide"],
    "apps": ["best-apps-for-ucsb-students", "how-lagoon-dining-works",
             "how-lagoon-schedule-works"],
}

# Which clusters each slug pulls from, in priority order
PAGE_CLUSTERS = {
    "best-apps-for-ucsb-students": ["apps", "campus_life", "classes"],
    "best-dorms-at-ucsb": ["housing", "onboarding"],
    "best-study-spots-at-ucsb": ["campus_life", "classes"],
    "how-lagoon-dining-works": ["dining", "apps"],
    "how-lagoon-schedule-works": ["classes", "apps"],
    "how-to-choose-classes-at-ucsb": ["classes", "onboarding"],
    "how-to-meet-people-at-ucsb": ["campus_life", "onboarding"],
    "how-to-plan-your-ucsb-schedule": ["classes", "campus_life"],
    "how-to-use-gold-at-ucsb": ["classes", "onboarding"],
    "isla-vista-guide-for-students": ["campus_life", "housing"],
    "ucsb-campus-events-guide": ["campus_life", "onboarding"],
    "ucsb-dining-menu": ["dining", "campus_life"],
    "ucsb-dorm-faq": ["housing", "onboarding"],
    "ucsb-finals-week-guide": ["campus_life", "classes"],
    "ucsb-first-week-guide": ["onboarding", "campus_life", "housing"],
    "ucsb-freshman-faq": ["onboarding", "classes", "housing"],
    "ucsb-ge-requirements-guide": ["classes", "onboarding"],
    "ucsb-grade-distributions-guide": ["classes", "campus_life"],
    "ucsb-meal-plan-guide": ["dining", "onboarding"],
    "ucsb-move-in-checklist": ["housing", "onboarding"],
    "ucsb-orientation-checklist": ["onboarding", "campus_life"],
    "ucsb-registration-guide": ["classes", "onboarding"],
    "ucsb-transfer-student-guide": ["onboarding", "classes"],
    "what-to-bring-to-ucsb-dorm": ["housing", "onboarding"],
    "what-to-do-between-classes-at-ucsb": ["campus_life", "classes"],
}

def pick_related(slug, n=5):
    seen, out = {slug}, []
    for cluster_name in PAGE_CLUSTERS.get(slug, []):
        for s in CLUSTERS[cluster_name]:
            if s in seen: continue
            seen.add(s); out.append(s)
            if len(out) >= n: return out
    # Pad with anything else if short
    for s in TITLES:
        if s in seen: continue
        out.append(s)
        if len(out) >= n: return out
    return out

BLOCK_TMPL = """
  <section class="related-guides" data-lagoon-related aria-labelledby="related-guides-title">
    <h2 id="related-guides-title">Related guides</h2>
    <ul class="related-guides-list">
{items}
    </ul>
    <p class="related-guides-cta">
      Want all of this in your pocket?
      <a href="https://apps.apple.com/us/app/ucsb-lagoon/id6760681142" rel="noreferrer" data-lagoon-cta="related-guides">Get Lagoon free →</a>
    </p>
  </section>
"""

ITEM_TMPL = '      <li><a href="/{slug}">{title}</a></li>'

# Minimal scoped CSS — only injected if the page doesn't already define it.
CSS = """<style data-lagoon-related-css>
.related-guides{max-width:900px;margin:48px auto 24px;padding:24px;border-top:1px solid #E2D2BF;
font-family:'Space Grotesk',system-ui,sans-serif}
.related-guides h2{font-size:22px;margin:0 0 16px;color:#1B2430}
.related-guides-list{list-style:none;padding:0;margin:0;display:grid;
grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px 20px}
.related-guides-list a{color:#003660;text-decoration:none;font-weight:600;font-size:15px;
border-bottom:1px dotted transparent;padding:6px 0;display:inline-block}
.related-guides-list a:hover{border-bottom-color:#003660}
.related-guides-cta{margin-top:18px;font-size:15px;color:#62594F}
.related-guides-cta a{color:#C8754C;font-weight:700;text-decoration:none;margin-left:6px}
.related-guides-cta a:hover{text-decoration:underline}
</style>
"""

def inject(slug):
    path = ROOT / slug / "index.html"
    if not path.exists():
        print(f"skip (missing): {slug}"); return
    html = path.read_text()
    if "data-lagoon-related" in html:
        print(f"skip (already injected): {slug}"); return
    items = "\n".join(
        ITEM_TMPL.format(slug=s, title=TITLES[s]) for s in pick_related(slug, 5)
    )
    block = BLOCK_TMPL.format(items=items)
    # Inject CSS into <head> once, block before </main>
    if "data-lagoon-related-css" not in html:
        html = html.replace("</head>", CSS + "</head>", 1)
    if "</main>" in html:
        html = html.replace("</main>", block + "\n  </main>", 1)
    else:
        # Fall back: inject before footer
        html = html.replace('<footer class="site-footer">',
                            block + '\n  <footer class="site-footer">', 1)
    path.write_text(html)
    print(f"ok: {slug}")

for slug in TITLES:
    inject(slug)
