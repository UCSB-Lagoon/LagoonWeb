import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getCourse, getCourseGrades, getCourseIndex, GRADE_SOURCE, COURSE_ORIGIN } from "@/lib/courses";
import { aggregateGrades, formatCount, formatGpa, formatRate, quarterOrder } from "@/lib/course-grades";
import { CourseCard } from "@/components/courses/course-card";
import { CourseCta, CourseSource, CourseUnavailable } from "@/components/courses/course-shared";
import { CourseEvents } from "@/components/courses/course-events";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ instructor?: string; quarter?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const filters = await searchParams;
  const path = `/courses/${slug}`;
  let course;
  try { course = await getCourse(slug); } catch { return { title: "Course data unavailable | Lagoon", robots: { index: false, follow: true }, alternates: { canonical: path } }; }
  if (!course) return { title: "Course not found | Lagoon", robots: { index: false, follow: true } };
  let available = true;
  try { available = (await getCourseGrades(course.department, course.number)).length > 0; } catch { available = false; }
  const title = `${course.id} UCSB Grade Distribution & Instructor History | Lagoon`;
  const description = `Explore historical ${course.id} grades at UCSB, including average GPA, A-range grades, and breakdowns by instructor and quarter. Free, no login required.`;
  return {
    title: { absolute: title }, description, alternates: { canonical: path },
    robots: { index: available && Object.keys(filters).length === 0, follow: true },
    openGraph: { title: `${course.id} · UCSB grade history`, description, url: `${COURSE_ORIGIN}${path}`, type: "website", images: [{ url: "/og-card.png", width: 1200, height: 630, alt: `${course.id} grade history on Lagoon` }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-card.png"] },
  };
}

export default async function CoursePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const filters = await searchParams;
  let course;
  try { course = await getCourse(slug); } catch { return <CourseUnavailable />; }
  if (!course) notFound();
  let rows;
  try { rows = await getCourseGrades(course.department, course.number); } catch { return <><header className="course-detail-hero"><Link href="/courses" className="course-back"><ArrowLeft size={16} aria-hidden="true" /> All courses</Link><h1>{course.id}</h1></header><CourseUnavailable /></>; }
  if (!rows.length) return <><header className="course-detail-hero"><Link href="/courses" className="course-back"><ArrowLeft size={16} aria-hidden="true" /> All courses</Link><h1>{course.id}</h1></header><CourseUnavailable /></>;
  const instructors = [...new Set(rows.map(row => row.instructor).filter((name): name is string => !!name))].sort();
  const quarters = [...new Set(rows.map(row => row.quarter))].sort((a, b) => quarterOrder(b) - quarterOrder(a));
  // Preserve invalid filters as an explicit empty result, rather than silently showing all grades.
  const instructor = (filters.instructor ?? "").slice(0, 120);
  const quarter = (filters.quarter ?? "").slice(0, 40);
  const selected = rows.filter(row => (!instructor || row.instructor === instructor) && (!quarter || row.quarter === quarter));
  const stats = aggregateGrades(selected);
  const filtered = !!(instructor || quarter);
  const history = [...new Set(selected.map(row => row.quarter))].sort((a, b) => quarterOrder(b) - quarterOrder(a));
  const index = await getCourseIndex();
  const related = index.filter(other => other.department === course.department && other.slug !== slug).sort((a, b) => b.enrolled - a.enrolled).slice(0, 3);
  const schema = {
    "@context": "https://schema.org", "@type": "WebPage", name: `${course.id} UCSB grade distribution`,
    description: `Historical grade distributions for ${course.id}, with instructor and quarter filters.`,
    url: `${COURSE_ORIGIN}/courses/${slug}`, citation: GRADE_SOURCE,
    breadcrumb: { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Courses", item: `${COURSE_ORIGIN}/courses` },
      { "@type": "ListItem", position: 2, name: course.id, item: `${COURSE_ORIGIN}/courses/${slug}` },
    ] },
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <header className="course-detail-hero">
      <Link href="/courses" className="course-back"><ArrowLeft size={16} aria-hidden="true" /> All courses</Link>
      <div className="course-hero-top"><span className="course-kicker">{course.department} · UC Santa Barbara</span><span className="course-kicker">Historical grades</span></div>
      <h1>{course.id}</h1><p>A clearer picture of the classes ahead.</p>
      <div className="course-hero-foot"><span>{formatCount(rows.length)} published records</span><span>{quarters[quarters.length - 1]} — {quarters[0]}</span></div>
    </header>
    <section className="course-grade-section" aria-labelledby="grade-heading">
      <div className="course-section-heading"><div><span className="course-kicker">Look a little closer</span><h2 id="grade-heading">The grade picture.</h2></div><span className="course-muted">{filtered ? "Filtered history" : "All available history"}</span></div>
      {selected.length > 0 && <div className="course-stat-strip"><div><strong>{formatGpa(stats.gpa)}</strong><span>Average GPA <small>weighted · out of 4.00</small></span></div><div><strong>{formatRate(stats.aRate)}</strong><span>A-range grades <small>A+, A, and A−</small></span></div><div><strong>{formatRate(stats.dfRate)}</strong><span>D / F grades <small>D+, D, D−, and F</small></span></div><div><strong>{formatCount(stats.letterStudents)}</strong><span>Letter grades <small>{formatCount(selected.length)} published records</small></span></div></div>}
      <form action={`/courses/${slug}`} method="get" className="course-filters">
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
          <div className="course-table-scroll"><table><caption className="sr-only">{course.id} historical grades by quarter{instructor ? ` for ${instructor}` : ""}</caption><thead><tr><th scope="col">Quarter</th><th scope="col">Average GPA</th><th scope="col">A range</th><th scope="col">D / F</th><th scope="col">Letter grades</th></tr></thead><tbody>{history.map(name => { const summary = aggregateGrades(selected.filter(row => row.quarter === name)); return <tr key={name}><th scope="row">{name}</th><td>{formatGpa(summary.gpa)}</td><td>{formatRate(summary.aRate)}</td><td>{formatRate(summary.dfRate)}</td><td>{formatCount(summary.letterStudents)}</td></tr>; })}</tbody></table></div>
        </details>
      </>}
      <CourseEvents course={course.id} instructor={!!instructor} quarter={!!quarter} />
    </section>
    <CourseCta />
    {related.length > 0 && <section className="course-results" aria-labelledby="related-courses"><div className="course-section-heading"><div><span className="course-kicker">Keep exploring</span><h2 id="related-courses">More in {course.department}.</h2></div><Link href={`/courses?department=${encodeURIComponent(course.department)}`} className="course-text-link">All {course.department} courses ↗</Link></div><div className="course-grid">{related.map(other => <CourseCard key={other.slug} course={other} />)}</div></section>}
    <CourseSource latest={quarters[0]} />
  </>;
}
