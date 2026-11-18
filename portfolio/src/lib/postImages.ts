import { getImageProps } from "next/image";

const escapeAttribute = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

// Rich posts are sanitized at save time. Prepare image attributes at render
// time as well, so older posts benefit without rewriting their saved content.
export function preparePostImages(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, tag => {
    const attribute = (name: string) => tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"))?.slice(1).find(value => value !== undefined);
    const src = attribute("src");
    if (!src) return tag;
    const width = Number(attribute("width")) || 1200;
    const height = Number(attribute("height")) || 800;
    const local = src.startsWith("/") && !src.startsWith("//");
    const { props } = getImageProps({ src: src.replace(/&amp;/g, "&"), alt: attribute("alt") ?? "", width, height, sizes: "(max-width: 768px) calc(100vw - 80px), 800px", loading: "lazy", unoptimized: !local });
    let clean = tag.replace(/\s(?:src|srcset|sizes|loading|decoding|width|height|style)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/\s*\/?\s*>$/, "");
    const attrs = { src: props.src, srcset: props.srcSet, sizes: props.sizes, loading: "lazy", decoding: "async", width, height, style: `${attribute("style") ?? ""};max-width:100%;height:auto;aspect-ratio:${width}/${height};object-fit:contain` };
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined) clean += ` ${key}="${escapeAttribute(String(value))}"`;
    }
    return `${clean}>`;
  });
}
