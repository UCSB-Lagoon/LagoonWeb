import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatCount, formatGpa, formatRate, type CourseSummary } from "@/lib/course-grades";

export function CourseCard({ course }: { course: CourseSummary }) {
  return <Link href={`/courses/${course.slug}`} className="course-card" prefetch={false}>
    <div className="course-card-heading"><span className="course-kicker">{course.department}</span><ArrowUpRight size={19} aria-hidden="true" /></div>
    <h3>{course.id}</h3>
    <div className="course-card-stats"><div><strong>{formatGpa(course.gpa)}</strong><span>Average GPA</span></div><div><strong>{formatRate(course.aRate)}</strong><span>A-range grades</span></div></div>
    <div className="course-card-foot"><span>{formatCount(course.enrolled)} enrollments</span><span>Through {course.latest}</span></div>
  </Link>;
}
