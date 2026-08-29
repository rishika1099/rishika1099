"use client";

import { useRef, useState } from "react";

/**
 * Makes anything that contains a file input accept a dropped file.
 *
 * Rather than rewiring every uploader, this finds the <input type="file">
 * inside itself, hands it the drop, and fires the change event the existing
 * handler is already listening for. So a drop and a click go down exactly the
 * same path, and there is no second code path to keep in step.
 */
function accepts(input: HTMLInputElement, file: File): boolean {
  const spec = (input.getAttribute("accept") ?? "").trim();
  if (!spec) return true;
  return spec.split(",").some((raw) => {
    const rule = raw.trim().toLowerCase();
    if (!rule) return false;
    if (rule.endsWith("/*")) return file.type.toLowerCase().startsWith(rule.slice(0, -1));
    if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule);
    return file.type.toLowerCase() === rule;
  });
}

export default function FileDrop({
  children,
  className = "",
  hint = "drop it here ✦",
}: {
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // dragenter/dragleave fire for every child too, so count them instead of
  // trusting a single leave to mean the pointer actually left
  const depth = useRef(0);
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState("");

  const reset = () => {
    depth.current = 0;
    setOver(false);
  };

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onDragEnter={(e) => {
        if (!e.dataTransfer?.types.includes("Files")) return;
        e.preventDefault();
        depth.current += 1;
        setOver(true);
        setRejected("");
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer?.types.includes("Files")) return;
        e.preventDefault(); // without this the browser refuses the drop
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        depth.current -= 1;
        if (depth.current <= 0) reset();
      }}
      onDrop={(e) => {
        if (!e.dataTransfer?.files?.length) return;
        e.preventDefault();
        reset();
        const input = ref.current?.querySelector<HTMLInputElement>('input[type="file"]');
        if (!input) return;
        const dropped = Array.from(e.dataTransfer.files);
        const ok = dropped.filter((f) => accepts(input, f));
        if (!ok.length) {
          setRejected(input.getAttribute("accept")?.includes("pdf") ? "images or PDFs only" : "images only");
          return;
        }
        const dt = new DataTransfer();
        for (const f of input.multiple ? ok : ok.slice(0, 1)) dt.items.add(f);
        input.files = dt.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }}
    >
      {children}
      {over && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-blush bg-blush/20 backdrop-blur-[1px]">
          <span className="rounded-full bg-white/90 px-3 py-1 font-body text-xs font-semibold text-ink shadow">
            {hint}
          </span>
        </div>
      )}
      {rejected && (
        <p className="mt-1 font-body text-[11px] font-semibold text-rose">{rejected}</p>
      )}
    </div>
  );
}
