import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCourse, getCourseGrades, getCourseIndex, GRADE_SOURCE, COURSE_ORIGIN } from "@/lib/courses";
import { formatCount, quarterOrder } from "@/lib/course-grades";
import { CourseCard } from "@/components/courses/course-card";
import { CourseCta, CourseSource, CourseUnavailable } from "@/components/courses/course-shared";
import { CourseGrades } from "@/components/courses/course-grades";

type Props = { params: Promise<{ slug: string }> };

/**
 * Static, generated on first request and cached until the next deploy (the
 * dataset is a build-time snapshot, so nothing here changes between deploys).
 * Do not read `searchParams` here — it would make all ~10k course pages render
 * per request again. Filters live client-side in <CourseGrades>.
 */
export function generateStaticParams() { return []; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
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
    robots: { index: available, follow: true },
    openGraph: { title: `${course.id} · UCSB grade history`, description, url: `${COURSE_ORIGIN}${path}`, type: "website", images: [{ url: "/og-card.png", width: 1200, height: 630, alt: `${course.id} grade history on Lagoon` }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-card.png"] },
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  let course;
  try { course = await getCourse(slug); } catch { return <CourseUnavailable />; }
  if (!course) notFound();
  let rows;
  try { rows = await getCourseGrades(course.department, course.number); } catch { return <><header className="course-detail-hero"><Link href="/courses" className="course-back"><ArrowLeft size={16} aria-hidden="true" /> All courses</Link><h1>{course.id}</h1></header><CourseUnavailable /></>; }
  if (!rows.length) return <><header className="course-detail-hero"><Link href="/courses" className="course-back"><ArrowLeft size={16} aria-hidden="true" /> All courses</Link><h1>{course.id}</h1></header><CourseUnavailable /></>;
  const instructors = [...new Set(rows.map(row => row.instructor).filter((name): name is string => !!name))].sort();
  const quarters = [...new Set(rows.map(row => row.quarter))].sort((a, b) => quarterOrder(b) - quarterOrder(a));
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
    <CourseGrades slug={slug} courseId={course.id} rows={rows} instructors={instructors} quarters={quarters} />
    <CourseCta />
    {related.length > 0 && <section className="course-results" aria-labelledby="related-courses"><div className="course-section-heading"><div><span className="course-kicker">Keep exploring</span><h2 id="related-courses">More in {course.department}.</h2></div><Link href={`/courses?department=${encodeURIComponent(course.department)}`} className="course-text-link">All {course.department} courses ↗</Link></div><div className="course-grid">{related.map(other => <CourseCard key={other.slug} course={other} />)}</div></section>}
    <CourseSource latest={quarters[0]} />
  </>;
}
