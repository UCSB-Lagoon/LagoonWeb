/** Generate a local-only snapshot for deterministic populated integration tests. */
import { writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
const base = {
  grade_a_plus: 0, grade_a: 0, grade_a_minus: 0,
  grade_b_plus: 0, grade_b: 0, grade_b_minus: 0,
  grade_c_plus: 0, grade_c: 0, grade_c_minus: 0,
  grade_d_plus: 0, grade_d: 0, grade_d_minus: 0, grade_f: 0,
  grade_p: 0, grade_np: 0, grade_s: 0, grade_u: 0,
};
const summary = (department, number, gpa, enrolled) => ({
  course_level: department, course_number: number, course_id: `${department} ${number}`,
  overall_avg_gpa: gpa, pct_a: gpa === null ? null : 45.5, pct_df: gpa === null ? null : 9.1,
  total_enrolled: enrolled, sections_offered: 2, most_recent_quarter: "Winter 2026",
});
const courses = [summary("MATH", "3A", 3.09, 1100), summary("MATH", "4A", 3.2, 200), summary("PSTAT", "120A", 2.8, 500), summary("INT", "199", null, 30),
  ...Array.from({ length: 1001 }, (_, i) => summary("TEST", String(i + 1), 3, 10))]
  .sort((a, b) => a.course_level.localeCompare(b.course_level) || a.course_number.localeCompare(b.course_number));
const mathRows = [
  { ...base, id: "a", quarter: "Winter 2026", instructor: "GARCIA M", total_students: 6, grade_a: 4, grade_b: 1, grade_f: 1 },
  { ...base, id: "b", quarter: "Fall 2025", instructor: "LEE J", total_students: 5, grade_a: 1, grade_b: 3, grade_c: 1 },
  ...Array.from({ length: 1001 }, (_, i) => ({ ...base, id: `p-${i}`, quarter: "Fall 2025", instructor: "LEE J", total_students: 1, grade_p: 1 })),
];
const keys = ["grade_a_plus", "grade_a", "grade_a_minus", "grade_b_plus", "grade_b", "grade_b_minus", "grade_c_plus", "grade_c", "grade_c_minus", "grade_d_plus", "grade_d", "grade_d_minus", "grade_f", "grade_p", "grade_np", "grade_s", "grade_u"];
const pack = row => [row.quarter, row.instructor, row.total_students, ...keys.map(key => row[key])];
const dataset = {
  version: 1, source: "local-test-fixture", sourceSha256: "fixture", retrievedAt: "2026-10-09T00:00:00Z",
  includedRecords: 2007, sourceRecords: 2007, omittedEmptyRecords: 0,
  courses: courses.map(course => [course.course_level, course.course_number,
    (course.course_level === "MATH" && course.course_number === "3A" ? mathRows : [{ ...base, quarter: "Winter 2026", instructor: "LEE J", total_students: 30, grade_p: 30 }]).map(pack)]),
};
mkdirSync("e2e/fixtures", { recursive: true });
writeFileSync("e2e/fixtures/course-grades.json.gz", gzipSync(JSON.stringify(dataset)));
