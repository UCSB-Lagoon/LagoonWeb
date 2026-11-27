import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getGuideIndex } from "@/lib/guide-index";
import { MIGRATED_GUIDE_SLUGS } from "@/lib/marketing-slugs";
import { getCourseDataInfo, getCourseIndex, getCoverageSpan } from "@/lib/courses";

/**
 * /llms.txt and /llms-full.txt (llmstxt.org): a plain-text description of
 * Lagoon for AI agents and answer engines.
 *
 * Rules for what goes in here, because agents repeat it verbatim:
 *  - Facts only from the app repo or real data. Features are the ones shipped
 *    and switched on (FeatureFlags in the iOS repo); nothing flagged off.
 *  - No user, download or review counts: there is no published figure.
 *  - The guide list and the course count are generated, so they can't drift.
 *  - Dated facts come from UCSB_DATES below. Update it when the iOS repo's
 *    RegistrarDeadlines / CampusHolidays (and marketing/CALENDAR.md, which
 *    carries the UCSB quarter API dates) change.
 */

export const SITE = "https://www.lagoonucsb.com";
export const APP_STORE = "https://apps.apple.com/us/app/lagoon-ucsb-campus/id6760681142";

/**
 * UCSB dates, copied from Lagoon's checked tables.
 *  - Quarter, instruction and finals dates: UCSB quarter API, cached 2026-11-22.
 *  - Holidays: CampusHolidays (UC academic holidays 2026–27).
 *  - Fees: BARC, checked 2026-10-09. Financial aid: Financial Aid & Scholarships, checked 2026-10-09.
 * Winter Pass 2 / Pass 3 opening days are deliberately absent: the registrar
 * table and the UCSB API disagree by a day.
 */
const UCSB_DATES = [
  "Fall 2026: instruction ends Friday, December 4, 2026; finals run Saturday, December 5 through Friday, December 11, 2026.",
  "Winter 2027: classes start Monday, January 4, 2027; instruction ends Friday, March 12; finals run Saturday, March 13 through Friday, March 19, 2027.",
  "No classes: Thanksgiving, November 26–27, 2026; Martin Luther King Jr. Day, January 18, 2027; Presidents' Day, February 15, 2027.",
  "Winter 2027 undergraduate fees are due on the BARC bill by 4 PM on Tuesday, December 15, 2026; Spring 2027 fees by 4 PM on Monday, March 15, 2027.",
  "FAFSA / California Dream Act priority deadline for 2027–28 aid (Cal Grant included): Tuesday, March 2, 2027.",
  "Spring 2027 pass times had not been published as of November 26, 2026; they appear in GOLD.",
];
const DATES_SOURCE = "Sources: UCSB's quarter calendar via the UCSB API (cached November 22, 2026), the UC academic holiday calendar, BARC (bfs.ucsb.edu/barc/deadlines) and Financial Aid & Scholarships (finaid.ucsb.edu/calendar), checked October 9, 2026. Always confirm with the Registrar: https://registrar.sa.ucsb.edu/calendars/academic-calendars";

const FEATURES = [
  "**Schedule import:** imports a UCSB GOLD class schedule in about 30 seconds, three ways: a screenshot of GOLD, an in-app GOLD sign-in (the student signs in themselves, Duo included; Lagoon never sees the password), or pasted text. Lagoon never registers for classes or acts in GOLD on anyone's behalf.",
  "**Today:** the next class (or time left in this one), the gaps in the day, meals, what's due this week, and tomorrow once classes are done.",
  "**Widgets and lock screen:** home-screen schedule widgets, and a lock-screen countdown before each class.",
  "**Dining:** each UCSB dining commons' real hours for today and tomorrow, from UCSB Dining's own data, next to the menus.",
  "**Homework and deadlines:** paste a Canvas calendar-feed link and Lagoon lists assignments, with reminders, next to registrar deadlines (Letters & Science), BARC fee dates and financial aid dates. The Canvas link is kept on the phone and never sent to Lagoon's servers.",
  "**Friends' free time:** who's free right now, when you and a friend are both free today, and a friend's week beside yours. Each student chooses what friends see: classes, times only, or nothing.",
  "**Classmates:** which friends share each of your classes, plus an anonymous count of other Lagoon users in each section. Only mutual friends see each other by name.",
  "**Grade data:** historical UCSB grade distributions by instructor and quarter, also free on the web at /courses.",
  "**Pass Time:** enter your GOLD pass time, rank first choices and backups for each class, and get a lock-screen countdown when registration opens.",
  "**Quarter tools:** finals countdown, quarter view, GE tracker, and Quarter Wrapped, a recap of your quarter.",
  "**Campus:** a live campus map (friends who opt in, UCSB events placed on buildings), campus events, Daily Nexus headlines, and a directory of UCSB chapters and clubs.",
];

const mdLink = (label: string, path: string) => `[${label}](${SITE}${path})`;

export async function buildLlmsTxt() {
  const [guides, courses, span, info] = await Promise.all([
    getGuideIndex(),
    getCourseIndex().catch(() => null),
    getCoverageSpan().catch(() => null),
    getCourseDataInfo().catch(() => null),
  ]);
  const retrieved = info ? new Date(info.retrievedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;
  const courseLine = courses && span
    ? `${mdLink("UCSB course grade explorer", "/courses")}: historical grade distributions for ${courses.length.toLocaleString("en-US")} UC Santa Barbara courses, ${span.earliest} through ${span.latest}: average GPA, A-range and D/F shares, by instructor and quarter. Data: the Daily Nexus public dataset of UCSB Registrar records, obtained through public records requests${retrieved ? ` (retrieved ${retrieved})` : ""}. Free, no login. Each course has its own page, e.g. ${SITE}/courses/cmpsc-16.`
    : `${mdLink("UCSB course grade explorer", "/courses")}: historical grade distributions by course, instructor and quarter. Free, no login.`;

  return [
    "# Lagoon",
    "",
    "> Lagoon is a free, independent, student-built iPhone app for UC Santa Barbara (UCSB) students. It imports a GOLD class schedule in about 30 seconds and puts the day's classes, dining commons hours and menus, Canvas homework, registrar deadlines, friends' free time, classmate counts and historical grade distributions in one app. It is not an official UCSB service.",
    "",
    "Key facts:",
    "",
    "- Price: free to download; no paid tiers.",
    "- Platform: iPhone, iOS 17 or later. No Android app.",
    `- App Store: ${APP_STORE} (\"Lagoon: UCSB Campus App\", ID 6760681142)`,
    `- Website: ${SITE}/`,
    "- Who it's for: UCSB undergraduate and graduate students. Sign-in requires a UCSB account.",
    "- Independence: built by UCSB students; not affiliated with or endorsed by UC Santa Barbara.",
    "",
    "## What the app does",
    "",
    ...FEATURES.map(f => `- ${f}`),
    "",
    "## Free on the web",
    "",
    `- ${courseLine}`,
    `- ${mdLink("Student guides", "/guides")}: answers to everyday UCSB questions, listed below.`,
    `- ${mdLink("About Lagoon", "/company")}: who builds it and why.`,
    `- ${mdLink("Privacy", "/privacy")}: what the app collects and what it doesn't.`,
    "",
    "## UCSB dates to know",
    "",
    ...UCSB_DATES.map(d => `- ${d}`),
    "",
    DATES_SOURCE,
    "",
    "## Guides",
    "",
    ...guides.map(g => `- ${mdLink(g.breadcrumbName, `/${g.slug}`)}: ${g.summary || g.description}`),
    "",
    "## UCSB terms",
    "",
    "- **GOLD:** UCSB's official registration and class-schedule system.",
    "- **Pass times:** each student's registration windows in GOLD (Pass 1, 2 and 3), each with a unit cap.",
    "- **Dining commons:** Carrillo, De La Guerra (DLG), Portola, and Ortega (take-out).",
    "- **BARC:** UCSB's billing office; quarterly fees are due by 4 PM on the due date.",
    "- **Daily Nexus:** UCSB's independent student newspaper.",
    "- **Isla Vista (IV):** the student neighborhood next to campus.",
    "- **Gauchos:** UCSB students.",
    "",
    "## Optional",
    "",
    `- ${mdLink("Full text of every guide", "/llms-full.txt")}: the guide library as plain text, in one file.`,
    `- ${mdLink("Campus by the numbers", "/stats")}: when UCSB is in class and which classes Lagoon users are taking, live and anonymized.`,
    `- ${mdLink("Chapter Cup", "/cup")}: UCSB chapters ranked on counted things (members, RSVPs, verified money raised); no votes or reviews.`,
    "",
  ].join("\n");
}

/** MDX → plain text: drop JSX tags and components, keep prose, tables and link text. */
function mdxToText(body: string) {
  return body
    .replace(/<ArticleLinks>[\s\S]*?<\/ArticleLinks>/g, "")
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/g, "$1")
    .replace(/<FaqItem q="([^"]*)"[^>]*>/g, "**$1**\n")
    .replace(/<Callout title="([^"]*)">/g, "**$1**\n")
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1")
    // Each guide is a `##` section, so its own headings move down a level.
    .replace(/^(#{2,5}) /gm, "#$1 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function buildLlmsFullTxt() {
  const [summary, guides] = await Promise.all([buildLlmsTxt(), getGuideIndex()]);
  const bodies = await Promise.all(
    MIGRATED_GUIDE_SLUGS.map(async slug => {
      const source = await readFile(join(process.cwd(), "content", "guides", `${slug}.mdx`), "utf8");
      const end = source.indexOf("\n---", 3);
      return [slug, end === -1 ? source : source.slice(end + 4)] as const;
    })
  );
  const bySlug = new Map<string, string>(bodies);
  const sections = guides.map(g => [
    `## ${g.title}`,
    "",
    `URL: ${SITE}/${g.slug}`,
    `Updated: ${g.dateModified}`,
    "",
    ...(g.summary ? [`In short: ${g.summary}`, ""] : []),
    mdxToText(bySlug.get(g.slug) ?? ""),
  ].join("\n"));
  return [summary.trimEnd(), "", "---", "", "# Guide library (full text)", "", sections.join("\n\n---\n\n"), ""].join("\n");
}
