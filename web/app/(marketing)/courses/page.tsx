import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { getCourseIndex, coverage, COURSE_ORIGIN } from "@/lib/courses";
import { courseSearch, formatCount } from "@/lib/course-grades";
import { CourseCard } from "@/components/courses/course-card";
import { CourseCta, CourseSource, CourseUnavailable } from "@/components/courses/course-shared";
import { CourseEvents } from "@/components/courses/course-events";

type Params = { q?: string; department?: string; page?: string };
type Props = { searchParams: Promise<Params> };
const title = "UCSB Course Search & Grade Distributions | Lagoon";
const description = "Explore UCSB historical grade distributions. Search courses, compare instructor and quarter results, and plan your next quarter. Free, no login required.";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  let available = true;
  try { available = (await getCourseIndex()).length > 0; } catch { available = false; }
  return {
    title: { absolute: title }, description, alternates: { canonical: "/courses" },
    robots: { index: available && Object.keys(params).length === 0, follow: true },
    openGraph: { title, description, url: `${COURSE_ORIGIN}/courses`, type: "website", images: [{ url: "/og-card.png", width: 1200, height: 630, alt: "Lagoon — UCSB course explorer" }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-card.png"] },
  };
}

export default async function CoursesPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 80);
  let courses;
  try { courses = await getCourseIndex(); } catch { courses = null; }
  const departments = [...new Set((courses ?? []).map(course => course.department))].sort();
  const department = departments.includes(params.department ?? "") ? params.department! : "";
  const matches = courseSearch(courses ?? [], q, department);
  const pages = Math.max(1, Math.ceil(matches.length / 24));
  const page = Math.min(pages, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const shown = matches.slice((page - 1) * 24, page * 24);
  const latest = coverage(courses ?? []);
  const pageUrl = (n: number) => { const query = new URLSearchParams(); if (q) query.set("q", q); if (department) query.set("department", department); if (n > 1) query.set("page", String(n)); return `/courses${query.size ? `?${query}` : ""}`; };
  return <>
    <header className="course-hero">
      <div className="course-hero-top"><span className="course-kicker">The Lagoon course explorer</span><span className="course-kicker">UC Santa Barbara</span></div>
      <h1>A little clarity.<br /><span>A better quarter.</span></h1>
      <p>Explore the grade history behind your next classes.<br className="course-desktop-break" /> Real UCSB data. Free to explore.</p>
      <form action="/courses" method="get" className="course-search" role="search" aria-label="Search UCSB courses">
        <div className="course-search-field"><Search size={22} aria-hidden="true" /><label className="sr-only" htmlFor="course-query">Course code</label><input id="course-query" name="q" type="search" placeholder="Try MATH 3A, ECON 10A, WRIT 2…" defaultValue={q} maxLength={80} /></div>
        <div className="course-department-field"><label className="sr-only" htmlFor="course-department">Department</label><select id="course-department" name="department" defaultValue={department}><option value="">All departments</option>{departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}</select></div>
        <button type="submit" className="course-button">Explore <ArrowRight size={18} aria-hidden="true" /></button>
      </form>
      <div className="course-hero-foot"><span>{courses ? `${formatCount(courses.length)} courses with historical data` : "No account needed"}</span>{latest && <span>Records through {latest}</span>}</div>
    </header>
    {!courses?.length ? <CourseUnavailable /> : <section className="course-results" aria-labelledby="course-results-title">
      <div className="course-section-heading"><div><span className="course-kicker">Explore the archive</span><h2 id="course-results-title">{q ? `Results for “${q}”` : department ? `${department} courses` : "Start with a course."}</h2></div><div className="course-results-meta"><span>{formatCount(matches.length)} {matches.length === 1 ? "course" : "courses"}{!q && !department ? " · Most enrollments first" : ""}</span>{(q || department) && <Link href="/courses" className="course-text-link">Clear filters</Link>}</div></div>
      {shown.length ? <div className="course-grid">{shown.map(course => <CourseCard key={course.slug} course={course} />)}</div> : <div className="course-empty"><h3>No matching courses yet.</h3><p>Try a course code such as MATH 3A, or choose a different department. Some courses don’t have published grade history.</p><Link href="/courses" className="course-text-link">Explore all courses ↗</Link></div>}
      {pages > 1 && <nav className="course-pagination" aria-label="Course results pages">{page > 1 ? <Link href={pageUrl(page - 1)} rel="prev">← Previous</Link> : <span />}<span>Page {page} of {pages}</span>{page < pages ? <Link href={pageUrl(page + 1)} rel="next">Next →</Link> : <span />}</nav>}
      <CourseEvents queryLength={q.length} department={department} results={matches.length} />
    </section>}
    <CourseCta /><CourseSource latest={latest} />
  </>;
}
