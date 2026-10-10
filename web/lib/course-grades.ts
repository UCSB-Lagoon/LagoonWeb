/** Pure grade math shared by the server and regression tests. */
export type GradeRecord = {
  quarter: string;
  instructor: string | null;
  total_students: number;
  grade_a_plus: number | null; grade_a: number | null; grade_a_minus: number | null;
  grade_b_plus: number | null; grade_b: number | null; grade_b_minus: number | null;
  grade_c_plus: number | null; grade_c: number | null; grade_c_minus: number | null;
  grade_d_plus: number | null; grade_d: number | null; grade_d_minus: number | null;
  grade_f: number | null;
  grade_p: number | null; grade_np: number | null; grade_s: number | null; grade_u: number | null;
};

export type CourseSummary = {
  id: string; department: string; number: string; slug: string;
  gpa: number | null; aRate: number | null; dfRate: number | null;
  enrolled: number; sections: number; latest: string;
};

export function courseSlug(department: string, number: string) {
  return `${department.trim()}-${number.trim()}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function quarterOrder(quarter: string) {
  const [season, year] = quarter.split(" ");
  return (Number(year) || 0) * 10 + ({ Winter: 1, Spring: 2, Summer: 3, Fall: 4 }[season] ?? 0);
}

const gradePoints = [4, 4, 3.7, 3.3, 3, 2.7, 2.3, 2, 1.7, 1.3, 1, 0.7, 0];
const gradeKeys = ["grade_a_plus", "grade_a", "grade_a_minus", "grade_b_plus", "grade_b", "grade_b_minus", "grade_c_plus", "grade_c", "grade_c_minus", "grade_d_plus", "grade_d", "grade_d_minus", "grade_f"] as const;

export function aggregateGrades(rows: GradeRecord[]) {
  const counts = gradeKeys.map(key => rows.reduce((sum, row) => sum + (row[key] ?? 0), 0));
  const letterStudents = counts.reduce((sum, n) => sum + n, 0);
  const points = counts.reduce((sum, n, i) => sum + n * gradePoints[i], 0);
  const groups = [
    { grade: "A", count: counts[0] + counts[1] + counts[2] },
    { grade: "B", count: counts[3] + counts[4] + counts[5] },
    { grade: "C", count: counts[6] + counts[7] + counts[8] },
    { grade: "D", count: counts[9] + counts[10] + counts[11] },
    { grade: "F", count: counts[12] },
  ].map(group => ({ ...group, percent: letterStudents ? group.count / letterStudents * 100 : 0 }));
  return {
    letterStudents, groups,
    gpa: letterStudents ? points / letterStudents : null,
    aRate: letterStudents ? groups[0].percent : null,
    dfRate: letterStudents ? groups[3].percent + groups[4].percent : null,
    enrolled: rows.reduce((sum, row) => sum + row.total_students, 0),
    nonLetter: rows.reduce((sum, row) => sum + (row.grade_p ?? 0) + (row.grade_np ?? 0) + (row.grade_s ?? 0) + (row.grade_u ?? 0), 0),
  };
}

export function courseSearch(courses: CourseSummary[], query: string, department: string) {
  const normalized = query.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return courses.filter(course => (!department || course.department === department) &&
    (!normalized || course.id.replace(/[^a-z0-9]/gi, "").includes(normalized)))
    .sort((a, b) => {
      const exact = (course: CourseSummary) => course.id.replace(/[^a-z0-9]/gi, "").toUpperCase() === normalized;
      return Number(exact(b)) - Number(exact(a)) || b.enrolled - a.enrolled || a.id.localeCompare(b.id);
    });
}

export const formatCount = (n: number) => n.toLocaleString("en-US");
export const formatGpa = (n: number | null) => n === null ? "—" : n.toFixed(2);
export const formatRate = (n: number | null) => n === null ? "—" : `${n.toFixed(1)}%`;
