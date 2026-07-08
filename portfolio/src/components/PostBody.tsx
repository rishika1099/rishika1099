"use client";

// Renders a markdown post with two reading niceties: an auto table of contents
// (from ## / ### headings) and a copy button on every code block.

import { useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// flatten a heading's children to plain text for anchor ids
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function CopyPre(props: { children?: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  return (
    <div className="group relative">
      <pre ref={ref} {...props} />
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(ref.current?.innerText ?? "").then(
            () => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            },
            () => {},
          );
        }}
        className="absolute right-2.5 top-2.5 rounded-lg bg-white/15 px-2.5 py-1 font-body text-[11px] font-semibold text-cream/90 opacity-0 transition group-hover:opacity-100 hover:bg-white/25"
      >
        {copied ? "copied ✓" : "copy"}
      </button>
    </div>
  );
}

export default function PostBody({ content }: { content: string }) {
  const toc = useMemo(
    () =>
      content
        .split("\n")
        .filter((l) => /^#{2,3}\s/.test(l))
        .map((l) => {
          const level = (l.match(/^#+/)?.[0].length ?? 2) as 2 | 3;
          const text = l.replace(/^#+\s+/, "").replace(/[*_`#]/g, "").trim();
          return { level, text, id: slug(text) };
        }),
    [content],
  );

  return (
    <>
      {toc.length >= 3 && (
        <nav className="mb-6 rounded-2xl bg-white/50 p-4">
          <p className="font-body text-[11px] font-bold uppercase tracking-wide text-ink-soft/70">
            on this page
          </p>
          <ul className="mt-2 space-y-1">
            {toc.map((h, i) => (
              <li key={i} className={h.level === 3 ? "ml-4" : ""}>
                <a href={`#${h.id}`} className="font-body text-sm text-ink-soft hover:text-ink">
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => <h2 id={slug(textOf(children))}>{children}</h2>,
          h3: ({ children }) => <h3 id={slug(textOf(children))}>{children}</h3>,
          pre: (props) => <CopyPre {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </>
  );
}
