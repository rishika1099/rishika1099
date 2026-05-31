"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface Photo {
  src: string;
  caption: string;
}

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

export default function PhotoGallery({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) {
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
              <div
                className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${p.gradient}`}
              >
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

  return (
    <div className="mt-10 flex flex-wrap justify-center gap-6">
      {photos.map((photo, i) => {
        const rotate = rotations[i % rotations.length];
        return (
          <motion.figure
            key={photo.src}
            initial={{ opacity: 0, y: 20, rotate }}
            whileInView={{ opacity: 1, y: 0, rotate }}
            viewport={{ once: true }}
            transition={{ delay: (i % 4) * 0.08 }}
            whileHover={{ rotate: 0, scale: 1.04, y: -6 }}
            className="w-52 rounded-sm bg-white p-3 pb-10 shadow-lg"
          >
            <div className="relative h-48 w-full overflow-hidden rounded-sm">
              <Image
                src={photo.src}
                alt={photo.caption || "a photo"}
                fill
                className="object-cover"
                sizes="208px"
              />
            </div>
            <figcaption className="mt-3 text-center font-hand text-xl text-ink-soft">
              {photo.caption || "untitled ✦"}
            </figcaption>
          </motion.figure>
        );
      })}
    </div>
  );
}
