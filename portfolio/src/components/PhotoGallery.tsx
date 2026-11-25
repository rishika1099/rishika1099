"use client";

import { useState } from "react";
import GalleryLightbox from "./GalleryLightbox";
import { useFeatureCopy } from "./FeatureCopy";
import { m } from "framer-motion";
import type { PhotoFrame, PhotoGroup } from "@/lib/photos";

// Soft placeholder frames shown until you drop real photos into /public/photos.
const placeholders = [
  { caption: "golden hour, somewhere", gradient: "from-dawn to-sunset", rotate: -4 },
  { caption: "city in the rain", gradient: "from-sky to-lavender", rotate: 3 },
  { caption: "a quiet window", gradient: "from-mint to-meadow", rotate: -2 },
  { caption: "lanterns", gradient: "from-gold to-blush", rotate: 5 },
  { caption: "the long walk home", gradient: "from-lavender to-petal", rotate: -5 },
  { caption: "morning coffee", gradient: "from-dawn to-gold", rotate: 2 },
  { caption: "sky doing its thing", gradient: "from-sky to-mint", rotate: -3 },
  { caption: "little details", gradient: "from-petal to-blush", rotate: 4 },
];

const rotations = [-4, 3, -2, 5, -5, 2, -3, 4];

function Frame({
  src,
  caption,
  i,
  frame,
}: {
  src?: string;
  caption: string;
  gradient?: string;
  i: number;
  frame?: PhotoFrame;
}) {
  const [open, setOpen] = useState(false);
  const t = useFeatureCopy();
  const rotate = rotations[i % rotations.length];
  const fx = frame?.x ?? 50;
  const fy = frame?.y ?? 50;
  const zoom = frame?.zoom ?? 1;
  return (
    <m.figure
      initial={{ opacity: 0, y: 20, rotate }}
      whileInView={{ opacity: 1, y: 0, rotate }}
      viewport={{ once: true }}
      transition={{ delay: (i % 4) * 0.08 }}
      whileHover={{ rotate: 0, scale: 1.04, y: -6 }}
      className="w-52 rounded-sm bg-white p-3 pb-10 shadow-lg"
    >
      <button type="button" onClick={() => setOpen(true)} aria-label={t("photography.photo.open", { caption: caption || t("photography.photo.untitled") })} className="relative block h-48 w-full overflow-hidden rounded-sm focus-visible:outline-2 focus-visible:outline-ink">
        {/* Stored thumbnails bypass the runtime image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/photo/${src!.split("/").pop()}?size=384`}
          srcSet={`/api/photo/${src!.split("/").pop()}?size=384 384w, /api/photo/${src!.split("/").pop()}?size=768 768w`}
          alt={caption || "a photo"}
          width={184}
          height={192}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          sizes="184px"
          style={{
            objectPosition: `${fx}% ${fy}%`,
            transform: zoom !== 1 ? `scale(${zoom})` : undefined,
            transformOrigin: `${fx}% ${fy}%`,
          }}
        />
      </button>
      {open && <GalleryLightbox src={src!} caption={caption || t("photography.photo.untitled")} onClose={() => setOpen(false)} />}
      <figcaption className="mt-3 text-center font-hand text-xl text-ink-soft">
        {caption || t("photography.photo.untitled")}
      </figcaption>
    </m.figure>
  );
}

export default function PhotoGallery({ groups }: { groups: PhotoGroup[] }) {
  const total = groups.reduce((n, g) => n + g.photos.length, 0);

  if (total === 0) {
    return (
      <div className="mt-10 flex flex-wrap justify-center gap-6">
        {placeholders.map((p, i) => (
          <m.figure
            key={i}
            initial={{ opacity: 0, y: 20, rotate: p.rotate }}
            whileInView={{ opacity: 1, y: 0, rotate: p.rotate }}
            viewport={{ once: true }}
            transition={{ delay: (i % 4) * 0.08 }}
            whileHover={{ rotate: 0, scale: 1.04, y: -6 }}
            className="w-52 rounded-sm bg-white p-3 pb-10 shadow-lg"
          >
            <div className="relative h-48 w-full overflow-hidden rounded-sm">
              <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${p.gradient}`}>
                <span className="text-3xl opacity-70">✦</span>
              </div>
            </div>
            <figcaption className="mt-3 text-center font-hand text-xl text-ink-soft">
              {p.caption}
            </figcaption>
          </m.figure>
        ))}
      </div>
    );
  }

  // ungrouped (no clusters): one flat wall
  if (groups.length === 1 && !groups[0].label) {
    return (
      <div className="mt-10 flex flex-wrap justify-center gap-6">
        {groups[0].photos.map((p, i) => (
          <Frame key={p.src} src={p.src} caption={p.caption} i={i} frame={p.frame} />
        ))}
      </div>
    );
  }

  // grouped by cluster, each with its auto-label heading
  return (
    <div className="mt-8 space-y-12">
      {groups.map((g, gi) => (
        <section key={g.label ?? gi}>
          {g.label && (
            <h2 className="font-body text-xl font-bold text-ink">
              {g.label} <span className="font-body text-sm font-normal text-ink-soft">· {g.photos.length}</span>
            </h2>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-6 sm:justify-start">
            {g.photos.map((p, i) => (
              <Frame key={p.src} src={p.src} caption={p.caption} i={i} frame={p.frame} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
