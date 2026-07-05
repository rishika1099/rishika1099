// Render an editable passage. Passages written in the ink editor are HTML;
// older/default passages are plain text (with **bold** and blank-line
// paragraphs), so upgrade those to HTML on the fly.

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function copyToHtml(text: string): string {
  if (/<[a-z][\s\S]*>/i.test(text)) return text; // already ink-editor HTML
  const paras = text
    .split(/\n\s*\n/)
    .map((p) =>
      escapeHtml(p.trim())
        .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
        .replace(/\n/g, "<br>"),
    )
    .filter(Boolean);
  return paras.length > 1 ? paras.map((p) => `<p>${p}</p>`).join("") : (paras[0] ?? "");
}

// About-card "details" used to be one string per bullet; now the editor writes
// a single rich-HTML block. Normalize either shape to HTML for rendering/editing.
export function detailsToHtml(details?: string[] | string): string {
  if (!details) return "";
  if (typeof details === "string") return copyToHtml(details);
  const items = details.map((d) => copyToHtml(d)).filter(Boolean);
  return items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>` : "";
}

// Is there anything to reveal? (non-empty array, or HTML with real text)
export function hasDetails(details?: string[] | string): boolean {
  if (!details) return false;
  if (Array.isArray(details)) return details.some((d) => d.trim());
  return details.replace(/<[^>]+>/g, "").trim().length > 0;
}
