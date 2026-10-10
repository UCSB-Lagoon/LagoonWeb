import "server-only";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { cache } from "react";
import { aggregateGrades, courseSlug, quarterOrder, type CourseSummary, type GradeRecord } from "./course-grades";

export const GRADE_SOURCE = "https://github.com/dailynexusdata/grades-data";
export const COURSE_ORIGIN = "https://www.lagoonucsb.com";

type PackedGrade = [string, string | null, number, ...Array<number | null>];
type Snapshot = {
  version: number; source: string; sourceSha256: string; retrievedAt: string;
  includedRecords: number; sourceRecords: number; omittedEmptyRecords: number;
  courses: Array<[string, string, PackedGrade[]]>;
};

let snapshotPromise: Promise<Snapshot> | undefined;
/** Versioned public snapshot; no authentication, database credentials, or runtime upstream requests. */
function readSnapshot() {
  snapshotPromise ??= readFile(resolve(process.cwd(), process.env.COURSE_GRADES_DATA_FILE || "data/course-grades.json.gz"))
    .then(buffer => {
      const data = JSON.parse(gunzipSync(buffer).toString("utf8")) as Snapshot;
      if (data.version !== 1 || !Array.isArray(data.courses) || !data.courses.length) throw new Error("Invalid course snapshot");
      return data;
    }).catch(error => { snapshotPromise = undefined; throw error; });
  return snapshotPromise;
}

function unpack(row: PackedGrade): GradeRecord {
  return {
    quarter: row[0], instructor: row[1], total_students: row[2],
    grade_a_plus: row[3], grade_a: row[4], grade_a_minus: row[5],
    grade_b_plus: row[6], grade_b: row[7], grade_b_minus: row[8],
    grade_c_plus: row[9], grade_c: row[10], grade_c_minus: row[11],
    grade_d_plus: row[12], grade_d: row[13], grade_d_minus: row[14], grade_f: row[15],
    grade_p: row[16], grade_np: row[17], grade_s: row[18], grade_u: row[19],
  };
}

let indexPromise: Promise<CourseSummary[]> | undefined;
export const getCourseIndex = cache(() => {
  indexPromise ??= readSnapshot().then(data => {
    const courses = data.courses.map(([department, number, packed]) => {
      const rows = packed.map(unpack);
      const stats = aggregateGrades(rows);
      const latest = rows.reduce((value, row) => quarterOrder(row.quarter) > quarterOrder(value) ? row.quarter : value, "");
      return {
        id: `${department} ${number}`, department, number, slug: courseSlug(department, number),
        gpa: stats.gpa, aRate: stats.aRate, dfRate: stats.dfRate,
        enrolled: stats.enrolled, sections: rows.length, latest,
      };
    });
    if (new Set(courses.map(course => course.slug)).size !== courses.length) throw new Error("Ambiguous course URLs in snapshot");
    return courses;
  }).catch(error => { indexPromise = undefined; throw error; });
  return indexPromise;
});

export const getCourse = cache(async (slug: string) => {
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) return null;
  return (await getCourseIndex()).find(course => course.slug === slug) ?? null;
});

export const getCourseGrades = cache(async (department: string, number: string): Promise<GradeRecord[]> => {
  const data = await readSnapshot();
  return (data.courses.find(course => course[0] === department && course[1] === number)?.[2] ?? []).map(unpack);
});

export const getCourseDataInfo = cache(async () => {
  const data = await readSnapshot();
  return { retrievedAt: data.retrievedAt, sourceSha256: data.sourceSha256, records: data.includedRecords };
});

export function coverage(courses: CourseSummary[]) {
  return courses.reduce((latest, course) => quarterOrder(course.latest) > quarterOrder(latest) ? course.latest : latest, "");
}
