import React from "react";

/**
 * Tiny, dependency-free Markdown renderer — just enough for the team handbook:
 * h1/h2/h3, paragraphs, ul/ol, GFM tables, fenced + inline code, bold, links,
 * task-list checkboxes, hr, blockquote. Not a general-purpose parser.
 *
 * ── On the accent used here ────────────────────────────────────────────────
 * This file used stock Tailwind `orange-*`, almost certainly because
 * public/site.css calls the brand gold `--orange` / `--orange-ink`. Those are
 * aliases; the actual orange scale is not in the brand and three of its
 * pairings failed AA. Measured against the `.card` this renders on
 * (#ffffff light, --color-navy-700 #00304c dark), as Tailwind v4 paints them:
 *
 *   orange-600 link      3.58:1 light / 3.84:1 dark   (needs 4.5)
 *   orange-700 hover     5.22:1 light / 2.63:1 dark
 *   bg-orange-50/50      a LIGHT tint that never flips, so at night the cream
 *                        ink composited over it landed at 1.64:1
 *
 * The replacements are ink for text and gold for the rule, which is the
 * fill-vs-ink split @theme already encodes. The link is NOT gold: --gold-ink
 * (#8a6a00) has no headroom in light mode — 5.07:1 on the white card, but
 * 4.49:1 on the cream page and 4.10:1 on the `cream-100` used by the
 * blockquote and the table head right here in this file. An ink step is
 * chosen against the worst surface it lands on, and for a link inside this
 * renderer that surface is cream-100, not the card. So gold carries the
 * underline (a rule needs 3:1, and gold-700 clears it on every surface here:
 * 4.10–5.07 light, 9.48–11.78 dark) while ink-900 carries the text
 * (13.84–17.10 light, 12.19–15.16 dark, everywhere).
 *
 * e2e/contrast.spec.ts measures all of this after paint — /admin/handbook is
 * behind an auth redirect, so the check is a synthetic fixture of these exact
 * class strings on these exact surfaces.
 */
/**
 * The three pairings the note above turned over, named so e2e/contrast.spec.ts
 * measures the strings that actually ship instead of a copy of them.
 *
 * /admin/handbook is behind an auth redirect, so the route sweep in that suite
 * cannot reach this renderer at all — the check has to be a synthetic fixture,
 * and a fixture holding its own copy of these class names would drift the
 * first time someone edited one. Same reason public/site.css fallbacks are
 * verified against @theme rather than trusted: a comment is not a mechanism.
 */
export const MD_CLASS = {
  /* Ink carries the text, gold carries the rule. See the note above for why
     the text is not gold: --gold-ink is 4.10:1 on the cream-100 that the
     blockquote and the table head below both use. */
  link: "text-ink-900 underline decoration-gold-700 decoration-2 underline-offset-2 hover:decoration-4",
  blockquote: "border-l-4 border-gold-700 bg-cream-100 pl-4 py-2 my-4 text-ink-700 italic",
  list: "list-disc pl-6 space-y-0.5 my-3 marker:text-gold-700",
} as const;

export function renderMarkdown(md: string): React.ReactElement {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactElement[] = [];
  let i = 0;
  let key = 0;
  const k = () => `b${key++}`;

  function inline(text: string): React.ReactNode {
    // Order matters: code first so ** inside ` isn't bolded.
    const nodes: React.ReactNode[] = [];
    const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
    let last = 0, m: RegExpExecArray | null;
    let idx = 0;
    while ((m = re.exec(text))) {
      if (m.index > last) nodes.push(text.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith("`")) {
        nodes.push(<code key={idx++} className="font-mono text-[0.85em] bg-cream-100 border border-cream-200 rounded px-1.5 py-0.5 text-ink-900">{tok.slice(1, -1)}</code>);
      } else if (tok.startsWith("**")) {
        nodes.push(<strong key={idx++} className="font-bold text-ink-900">{tok.slice(2, -2)}</strong>);
      } else {
        const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok)!;
        // Hover thickens the rule rather than recolouring the text: every
        // colour that reads as "hovered gold" is under 4.5:1 on one of the
        // surfaces a link lands on here. Weight can't fail a contrast check.
        nodes.push(<a key={idx++} href={mm[2]} className={MD_CLASS.link} target={mm[2].startsWith("http") ? "_blank" : undefined} rel="noreferrer">{mm[1]}</a>);
      }
      last = m.index + tok.length;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
  }

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // Fenced code
    if (line.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      blocks.push(
        <pre key={k()} className="bg-ink-900 text-cream-50 rounded-xl p-4 overflow-x-auto text-sm my-4 font-mono leading-relaxed">
          <code>{buf.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Headings
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length;
      const cls =
        lvl === 1 ? "font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink-900 mt-2 mb-4"
        : lvl === 2 ? "font-display text-2xl font-bold text-ink-900 mt-10 mb-3 pt-6 border-t border-cream-200"
        : "font-display text-lg font-bold text-ink-900 mt-6 mb-2";
      const Tag = (`h${lvl}` as "h1" | "h2" | "h3");
      blocks.push(<Tag key={k()} className={cls}>{inline(h[2])}</Tag>);
      i++;
      continue;
    }

    // HR
    if (/^---+$/.test(line.trim())) { blocks.push(<hr key={k()} className="my-8 border-cream-200" />); i++; continue; }

    // Blockquote
    if (line.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
      // `cream-100` is the tint because it FLIPS — #ebe7dc by day, navy-800
      // #002a42 at night. The old `bg-orange-50/50` did not, which is the
      // whole bug: the fill stayed pale while the ink turned cream.
      // ink-700 on it: 9.58:1 light, 7.67:1 dark.
      blocks.push(
        <blockquote key={k()} className={MD_CLASS.blockquote}>
          {inline(buf.join(" "))}
        </blockquote>
      );
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const head = line.split("|").map(s => s.trim()).filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(lines[i].split("|").map(s => s.trim()).filter((_, idx, arr) => !(idx === 0 && arr[0] === "") ));
        i++;
      }
      blocks.push(
        <div key={k()} className="my-4 overflow-x-auto">
          <table className="w-full text-sm border border-cream-200 rounded-xl overflow-hidden">
            <thead className="bg-cream-100">
              <tr>{head.map((c, idx) => <th key={idx} className="text-left font-semibold text-ink-900 px-3 py-2 border-b border-cream-200">{inline(c)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="even:bg-cream-100/40">
                  {r.map((c, ci) => <td key={ci} className="px-3 py-2 border-b border-cream-200 text-ink-700 align-top">{inline(c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Lists (ul / ol / task)
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      const ordered = /^\s*\d+\.\s+/.test(line);
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        const raw = lines[i].replace(/^\s*([-*]|\d+\.)\s+/, "");
        const task = /^\[( |x|X)\]\s+(.*)$/.exec(raw);
        if (task) {
          items.push(
            <li key={items.length} className="flex items-start gap-2 my-1">
              <span className={`mt-0.5 inline-grid place-items-center w-4 h-4 rounded border ${task[1].toLowerCase() === "x" ? "bg-emerald-500 border-emerald-500 text-white" : "border-cream-200 bg-white"}`}>
                {task[1].toLowerCase() === "x" ? "✓" : ""}
              </span>
              <span className="text-ink-700">{inline(task[2])}</span>
            </li>
          );
        } else {
          items.push(<li key={items.length} className="my-1 text-ink-700">{inline(raw)}</li>);
        }
        i++;
      }
      blocks.push(
        ordered
          ? <ol key={k()} className="list-decimal pl-6 space-y-0.5 my-3">{items}</ol>
          : <ul key={k()} className={MD_CLASS.list}>{items}</ul>
      );
      continue;
    }

    // Paragraph (gather until blank)
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|>|\s*([-*]|\d+\.)\s)/.test(lines[i]) && !/^---+$/.test(lines[i].trim())) {
      buf.push(lines[i]); i++;
    }
    blocks.push(<p key={k()} className="my-3 text-ink-700 leading-relaxed">{inline(buf.join(" "))}</p>);
  }

  return <>{blocks}</>;
}
