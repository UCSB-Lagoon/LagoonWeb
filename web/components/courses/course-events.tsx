"use client";
import { useEffect, useRef } from "react";
import { trackSiteEvent } from "@/components/site-analytics";

type Props = { course?: string; queryLength?: number; department?: string; results?: number; instructor?: boolean; quarter?: boolean };

/** Address the marketing stream explicitly, as the rest of this route group does. */
export function CourseEvents(props: Props) {
  const payload = JSON.stringify(props);
  const last = useRef("");
  useEffect(() => {
    if (last.current === payload) return;
    last.current = payload;
    const data = JSON.parse(payload) as Props;
    const event = (name: string, fields: Record<string, unknown>) => trackSiteEvent("G-2F8CTN4DNP", name, {
      ...fields, page_path: window.location.pathname,
    });
    if (data.course) event("course_view", { course_id: data.course });
    if (data.course && (data.instructor || data.quarter)) event("course_filter", {
      course_id: data.course, instructor_filter: !!data.instructor, quarter_filter: !!data.quarter,
    });
    if (!data.course && (data.queryLength || data.department)) event("course_search", {
      query_length: data.queryLength ?? 0, department: data.department ?? "", result_count: data.results ?? 0,
    });
  }, [payload]);
  return null;
}
