import React from "react";

/**
 * Tiny, dependency-free Markdown renderer — just enough for the team handbook:
 * h1/h2/h3, paragraphs, ul/ol, GFM tables, fenced + inline code, bold, links,
 * task-list checkboxes, hr, blockquote. Not a general-purpose parser.
 */
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
        nodes.push(<a key={idx++} href={mm[2]} className="text-orange-600 hover:text-orange-700 underline underline-offset-2" target={mm[2].startsWith("http") ? "_blank" : undefined} rel="noreferrer">{mm[1]}</a>);
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
      blocks.push(
        <blockquote key={k()} className="border-l-4 border-orange-400 bg-orange-50/50 pl-4 py-2 my-4 text-ink-700 italic">
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
          : <ul key={k()} className="list-disc pl-6 space-y-0.5 my-3 marker:text-orange-400">{items}</ul>
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
