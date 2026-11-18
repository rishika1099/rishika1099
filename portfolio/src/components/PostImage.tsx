import Image from "next/image";
// Only same-origin images go through the optimizer. Remote Markdown images keep
// their author's source; no arbitrary remote image proxy is opened.
export default function PostImage({ src, alt = "", title }: { src?: string; alt?: string; title?: string }) {
  if (!src) return null;
  const local = src.startsWith("/") && !src.startsWith("//");
  return <a href={src} target="_blank" rel="noreferrer" title={title}>
    <Image src={src} alt={alt} width={1200} height={800} sizes="(max-width: 768px) calc(100vw - 80px), 800px" loading="lazy" unoptimized={!local} className="aspect-[3/2] h-auto w-full rounded-xl object-contain" />
  </a>;
}
