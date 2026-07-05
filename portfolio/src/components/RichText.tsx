// Render an editable passage's HTML inline (titles, headings, prose). Safe in
// both server and client components. Content is sanitized at save time.

export default function RichText({
  html,
  className = "",
  as = "span",
}: {
  html: string;
  className?: string;
  as?: "span" | "div";
}) {
  const Tag = as;
  return <Tag className={`rich-passage ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
