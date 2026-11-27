import { aggregateGrades, formatGpa, formatRate, quarterOrder, type GradeRecord } from "./course-grades";
import { COURSE_ORIGIN, GRADE_SOURCE } from "./courses";

/**
 * Answer-first copy and structured data for the course explorer.
 *
 * Everything here is computed from a course's FULL history, never from the
 * `?instructor=` / `?quarter=` filters: the canonical page (and its meta
 * description) must say the same thing however it was reached. Counts of
 * students are deliberately left out of the prose; rates and GPA are what
 * people ask for, and they're what the source reports reliably.
 */

const yearOf = (quarter: string) => quarter.split(" ")[1] ?? "";

export function quarterSpan(rows: Pick<GradeRecord, "quarter">[]) {
  const quarters = [...new Set(rows.map(row => row.quarter))].sort((a, b) => quarterOrder(a) - quarterOrder(b));
  return { earliest: quarters[0] ?? "", latest: quarters[quarters.length - 1] ?? "", count: quarters.length };
}

/** "CMPSC 16 at UC Santa Barbara averaged a 3.22 GPA …" — one quotable sentence. */
export function courseAnswer(courseId: string, rows: GradeRecord[]) {
  const stats = aggregateGrades(rows);
  const { earliest, latest } = quarterSpan(rows);
  const span = earliest === latest ? `in ${earliest}` : `from ${earliest} to ${latest}`;
  const records = `${rows.length} published grade ${rows.length === 1 ? "record" : "records"}`;
  if (stats.gpa === null) {
    return `${courseId} at UC Santa Barbara has ${records} ${span}, all graded pass/no pass or satisfactory/unsatisfactory, so there is no GPA to report.`;
  }
  return `${courseId} at UC Santa Barbara averaged a ${formatGpa(stats.gpa)} GPA across ${records} ${span}. ${formatRate(stats.aRate)} of letter grades were in the A range and ${formatRate(stats.dfRate)} were D or F.`;
}

/** Meta description: the numbers first, then what the page lets you do. */
export function courseDescription(courseId: string, rows: GradeRecord[]) {
  const stats = aggregateGrades(rows);
  const { earliest, latest } = quarterSpan(rows);
  const span = earliest === latest ? earliest : `${earliest} – ${latest}`;
  const lead = stats.gpa === null
    ? `${courseId} at UCSB: pass/no pass grade history, ${span}.`
    : `${courseId} at UCSB: ${formatGpa(stats.gpa)} average GPA, ${formatRate(stats.aRate)} A-range and ${formatRate(stats.dfRate)} D/F grades, ${span}.`;
  return `${lead} Grade distributions by instructor and quarter. Free, no login required.`;
}

const DAILY_NEXUS = { "@type": "Organization", name: "Daily Nexus", url: "https://dailynexus.com/" } as const;
const REGISTRAR = { "@type": "Organization", name: "UC Santa Barbara Office of the Registrar", url: "https://registrar.sa.ucsb.edu/" } as const;
const MEASURED = ["Average GPA (letter grades, weighted)", "Share of A-range grades (A+, A, A−)", "Share of D and F grades", "Grade counts by letter, instructor and quarter"];

/** Dataset describing one course's grade history. */
export function courseDataset(courseId: string, slug: string, rows: GradeRecord[]) {
  const { earliest, latest } = quarterSpan(rows);
  return {
    "@type": "Dataset",
    "@id": `${COURSE_ORIGIN}/courses/${slug}#dataset`,
    name: `${courseId} UCSB historical grade distribution`,
    description: `${courseAnswer(courseId, rows)} Historical grade counts for ${courseId} at UC Santa Barbara by instructor and quarter, from the Daily Nexus public dataset of UCSB Registrar records.`,
    url: `${COURSE_ORIGIN}/courses/${slug}`,
    isAccessibleForFree: true,
    temporalCoverage: `${yearOf(earliest)}/${yearOf(latest)}`,
    variableMeasured: MEASURED,
    isBasedOn: GRADE_SOURCE,
    creator: DAILY_NEXUS,
    sourceOrganization: REGISTRAR,
    spatialCoverage: { "@type": "Place", name: "University of California, Santa Barbara" },
  };
}

/** Dataset describing the whole explorer, for /courses. */
export function catalogDataset(courseCount: number, earliest: string, latest: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${COURSE_ORIGIN}/courses#dataset`,
    name: "UCSB historical grade distributions",
    description: `Historical grade distributions for ${courseCount.toLocaleString("en-US")} UC Santa Barbara courses from ${earliest} to ${latest}: average GPA, A-range and D/F shares, by instructor and quarter. From the Daily Nexus public dataset of UCSB Registrar records, obtained through public records requests. Free to search, no login required.`,
    url: `${COURSE_ORIGIN}/courses`,
    isAccessibleForFree: true,
    temporalCoverage: `${yearOf(earliest)}/${yearOf(latest)}`,
    variableMeasured: MEASURED,
    isBasedOn: GRADE_SOURCE,
    creator: DAILY_NEXUS,
    sourceOrganization: REGISTRAR,
    spatialCoverage: { "@type": "Place", name: "University of California, Santa Barbara" },
  };
}
