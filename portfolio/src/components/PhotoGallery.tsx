"use client";

import Image from "next/image";
import { motion } from "framer-motion";
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
  const rotate = rotations[i % rotations.length];
  const fx = frame?.x ?? 50;
  const fy = frame?.y ?? 50;
  const zoom = frame?.zoom ?? 1;
  return (
    <motion.figure
      initial={{ opacity: 0, y: 20, rotate }}
      whileInView={{ opacity: 1, y: 0, rotate }}
      viewport={{ once: true }}
      transition={{ delay: (i % 4) * 0.08 }}
      whileHover={{ rotate: 0, scale: 1.04, y: -6 }}
      className="w-52 rounded-sm bg-white p-3 pb-10 shadow-lg"
    >
      <div className="relative h-48 w-full overflow-hidden rounded-sm">
        <Image
          src={src!}
          alt={caption || "a photo"}
          fill
          unoptimized
          className="object-cover"
          sizes="208px"
          style={{
            objectPosition: `${fx}% ${fy}%`,
            transform: zoom !== 1 ? `scale(${zoom})` : undefined,
            transformOrigin: `${fx}% ${fy}%`,
          }}
        />
      </div>
      <figcaption className="mt-3 text-center font-hand text-xl text-ink-soft">
        {caption || "untitled ✦"}
      </figcaption>
    </motion.figure>
  );
}

export default function PhotoGallery({ groups }: { groups: PhotoGroup[] }) {
  const total = groups.reduce((n, g) => n + g.photos.length, 0);

  if (total === 0) {
    return (
      <div className="mt-10 flex flex-wrap justify-center gap-6">
        {placeholders.map((p, i) => (
          <motion.figure
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
          </motion.figure>
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
