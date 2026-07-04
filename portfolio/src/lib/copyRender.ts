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
