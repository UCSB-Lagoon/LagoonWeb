import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GRADE_SOURCE, getCourseDataInfo } from "@/lib/courses";

export function CourseCta() {
  return <aside className="course-cta">
    <div><span className="course-kicker">Your next quarter</span><h2>Find your classes.<br />Make them your day.</h2><p>Once you’ve registered, import your GOLD schedule into Lagoon. Your classes, in one beautiful Today view.</p></div>
    <a href="https://apps.apple.com/us/app/ucsb-lagoon/id6760681142" className="course-button" data-lagoon-cta="courses">Get Lagoon for iPhone <ArrowUpRight size={18} aria-hidden="true" /></a>
  </aside>;
}

export async function CourseSource({ latest }: { latest?: string }) {
  const info = await getCourseDataInfo().catch(() => null);
  return <div className="course-source"><span className="course-kicker">About the numbers</span><p>Historical grade data from the <a href={GRADE_SOURCE} target="_blank" rel="noopener noreferrer">Daily Nexus</a>, obtained from UCSB’s Registrar through public records requests.{latest ? ` Available records extend through ${latest}.` : ""} Course history is not a list of current offerings.{info && <> Dataset retrieved <time dateTime={info.retrievedAt}>{new Date(info.retrievedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</time>.</>}</p><p>GPA and grade percentages use letter grades only, weighted by the number of grades. A range includes A+, A, and A−. Repeated enrollments count separately. Past grades don’t predict your result or a course’s workload. <Link href="/ucsb-grade-distributions-guide">How to read grade distributions ↗</Link></p></div>;
}

export function CourseUnavailable() {
  return <div className="course-empty" role="status"><h2>Grades are taking a moment.</h2><p>We couldn’t load the historical data. Please try again shortly.</p><Link href="/courses" className="course-text-link">Try course search again ↗</Link><a href={GRADE_SOURCE} className="course-text-link">Visit the Daily Nexus dataset ↗</a></div>;
}
