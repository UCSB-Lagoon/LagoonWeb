import { redirect } from "next/navigation";
import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Shield, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/admin";
import { renderMarkdown } from "@/lib/mini-markdown";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team handbook · Admin" };

export default async function HandbookPage() {
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/login?next=/admin/handbook");
  if (!isAdminEmail(user.email)) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-ink-900">Not authorized</h1>
        <p className="mt-3 text-ink-500">{user.email} isn&apos;t on the admin list.</p>
        <Link href="/" className="btn-secondary mt-6 inline-flex">Home</Link>
      </div>
    );
  }

  let md = "";
  try {
    md = readFileSync(join(process.cwd(), "content/onboarding.md"), "utf8");
  } catch {
    md = "# Handbook unavailable\n\nCould not read `content/onboarding.md`.";
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <div className="flex items-center justify-between mb-8">
        <span className="pill"><Shield className="w-3 h-3" /> Admin · Handbook</span>
        <Link href="/admin" className="text-sm font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
      </div>
      <article className="card p-6 sm:p-10">
        {renderMarkdown(md)}
      </article>
      <p className="mt-6 text-xs text-ink-400 text-center">
        Source: <span className="font-mono">ONBOARDING.md</span> · edit there and redeploy to update this page.
      </p>
    </div>
  );
}
