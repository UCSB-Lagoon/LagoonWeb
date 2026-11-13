"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { aggregateGrades, formatCount, formatGpa, formatRate, quarterOrder, type GradeRecord } from "@/lib/course-grades";
import { CourseEvents } from "@/components/courses/course-events";

type Props = { slug: string; courseId: string; rows: GradeRecord[]; instructors: string[]; quarters: string[] };

/**
 * The instructor/quarter filter runs in the browser so the course page itself
 * can be static. It used to read `searchParams` on the server, which made all
 * ~10k course pages render per request — every crawler hit cost a function
 * invocation (and, on a cold instance, a gunzip + parse of the whole dataset).
 *
 * The static HTML is the unfiltered view (the Suspense fallback), so crawlers
 * and no-JS visitors get the full history; `?instructor=`/`?quarter=` links
 * still work once the client reads them.
 */
export function CourseGrades(props: Props) {
  return <Suspense fallback={<GradeExplorer {...props} instructor="" quarter="" />}><FromQuery {...props} /></Suspense>;
}

function FromQuery(props: Props) {
  const params = useSearchParams();
  return <GradeExplorer {...props} instructor={(params.get("instructor") ?? "").slice(0, 120)} quarter={(params.get("quarter") ?? "").slice(0, 40)} />;
}

function GradeExplorer({ slug, courseId, rows, instructors, quarters, instructor, quarter }: Props & { instructor: string; quarter: string }) {
  // Preserve invalid filters as an explicit empty result, rather than silently showing all grades.
  const selected = rows.filter(row => (!instructor || row.instructor === instructor) && (!quarter || row.quarter === quarter));
  const stats = aggregateGrades(selected);
  const filtered = !!(instructor || quarter);
  const history = [...new Set(selected.map(row => row.quarter))].sort((a, b) => quarterOrder(b) - quarterOrder(a));
  return <section className="course-grade-section" aria-labelledby="grade-heading">
    <div className="course-section-heading"><div><span className="course-kicker">Look a little closer</span><h2 id="grade-heading">The grade picture.</h2></div><span className="course-muted">{filtered ? "Filtered history" : "All available history"}</span></div>
    {selected.length > 0 && <div className="course-stat-strip"><div><strong>{formatGpa(stats.gpa)}</strong><span>Average GPA <small>weighted · out of 4.00</small></span></div><div><strong>{formatRate(stats.aRate)}</strong><span>A-range grades <small>A+, A, and A−</small></span></div><div><strong>{formatRate(stats.dfRate)}</strong><span>D / F grades <small>D+, D, D−, and F</small></span></div><div><strong>{formatCount(stats.letterStudents)}</strong><span>Letter grades <small>{formatCount(selected.length)} published records</small></span></div></div>}
    {/* key: remount when the URL changes so the uncontrolled selects pick up the new defaults */}
    <form key={`${instructor}|${quarter}`} action={`/courses/${slug}`} method="get" className="course-filters">
      <div><label htmlFor="grade-instructor">Instructor</label><select id="grade-instructor" name="instructor" defaultValue={instructor}><option value="">All instructors</option>{instructor && !instructors.includes(instructor) && <option value={instructor}>Unknown instructor</option>}{instructors.map(name => <option key={name} value={name}>{name}</option>)}</select></div>
      <div><label htmlFor="grade-quarter">Quarter</label><select id="grade-quarter" name="quarter" defaultValue={quarter}><option value="">All quarters</option>{quarter && !quarters.includes(quarter) && <option value={quarter}>Unknown quarter</option>}{quarters.map(name => <option key={name} value={name}>{name}</option>)}</select></div>
      <button type="submit" className="course-button">Apply filters <ArrowRight size={18} aria-hidden="true" /></button>{filtered && <Link href={`/courses/${slug}`} className="course-text-link">Reset</Link>}
    </form>
    {!selected.length ? <div className="course-empty"><h3>No records for this combination.</h3><p>Try another instructor or quarter to explore the available history.</p><Link href={`/courses/${slug}`} className="course-text-link">View all history ↗</Link></div> : <>
      <div className="course-chart-panel"><div className="course-chart-title"><h3>Grade distribution</h3><span className="course-muted">{instructor || "All instructors"} · {quarter || "All quarters"}</span></div>
        {stats.letterStudents ? <div className="course-bars" role="img" aria-label={`Grade distribution: ${stats.groups.map(group => `${group.grade} ${group.percent.toFixed(1)} percent`).join(", ")}. Plus and minus grades grouped together.`}>{stats.groups.map(group => <div className="course-bar-column" key={group.grade}><span className="course-bar-value">{formatRate(group.percent)}</span><div className="course-bar-track"><div className={`course-bar course-bar-${group.grade.toLowerCase()}`} style={{ height: `${group.percent}%` }} /></div><strong>{group.grade}</strong><span className="course-muted">{formatCount(group.count)}</span></div>)}</div> : <div className="course-empty"><h3>No letter grades in these records.</h3><p>These records use pass/no pass or satisfactory/unsatisfactory grading. GPA and letter-grade percentages don’t apply.</p></div>}
        <p className="course-chart-caption">Plus and minus grades are grouped together.{stats.nonLetter > 0 ? ` ${formatCount(stats.nonLetter)} reported P/NP or S/U grades are excluded from GPA and percentages.` : ""} Counts reflect grades before optional grading conversions in the original source.</p>
      </div>
      <details className="course-history"><summary className="course-section-heading course-history-toggle"><h3>Quarter by quarter</h3><span className="course-muted">{history.length} {history.length === 1 ? "quarter" : "quarters"}</span></summary>
        <div className="course-table-scroll"><table><caption className="sr-only">{courseId} historical grades by quarter{instructor ? ` for ${instructor}` : ""}</caption><thead><tr><th scope="col">Quarter</th><th scope="col">Average GPA</th><th scope="col">A range</th><th scope="col">D / F</th><th scope="col">Letter grades</th></tr></thead><tbody>{history.map(name => { const summary = aggregateGrades(selected.filter(row => row.quarter === name)); return <tr key={name}><th scope="row">{name}</th><td>{formatGpa(summary.gpa)}</td><td>{formatRate(summary.aRate)}</td><td>{formatRate(summary.dfRate)}</td><td>{formatCount(summary.letterStudents)}</td></tr>; })}</tbody></table></div>
      </details>
    </>}
    <CourseEvents course={courseId} instructor={!!instructor} quarter={!!quarter} />
  </section>;
}
