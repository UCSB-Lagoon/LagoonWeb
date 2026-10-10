import { getCourseIndex, COURSE_ORIGIN } from "@/lib/courses";

export const revalidate = 3600;

export async function GET() {
  try {
    const courses = await getCourseIndex();
    // No invented lastmod dates: a record's quarter is not a page update date.
    const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${courses.map(course => `<url><loc>${COURSE_ORIGIN}/courses/${course.slug}</loc></url>`).join("")}</urlset>`;
    return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
  } catch {
    return new Response("Course sitemap temporarily unavailable", { status: 503, headers: { "Retry-After": "300" } });
  }
}
