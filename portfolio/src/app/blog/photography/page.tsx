"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";

interface Photo {
  caption: string;
  src?: string; // drop a file in /public/photos and set this
  gradient: string; // placeholder until a real photo is added
  rotate: number;
}

// Replace `gradient` placeholders with `src: "/photos/your-photo.jpg"` anytime.
const photos: Photo[] = [
  { caption: "golden hour, somewhere", gradient: "from-dawn to-sunset", rotate: -4 },
  { caption: "city in the rain", gradient: "from-sky to-lavender", rotate: 3 },
  { caption: "a quiet window", gradient: "from-mint to-meadow", rotate: -2 },
  { caption: "lanterns", gradient: "from-gold to-blush", rotate: 5 },
  { caption: "the long walk home", gradient: "from-lavender to-petal", rotate: -5 },
  { caption: "morning coffee", gradient: "from-dawn to-gold", rotate: 2 },
  { caption: "sky doing its thing", gradient: "from-sky to-mint", rotate: -3 },
  { caption: "little details", gradient: "from-petal to-blush", rotate: 4 },
];

export default function Photography() {
  return (
    <PageShell vibe="sunset">
      <Link href="/blog" className="font-body text-sm text-ink-soft hover:text-ink">
        ← back to the writing room
      </Link>
      <PageTitle className="mt-2 text-ink">photography 📷</PageTitle>
      <p className="mt-3 max-w-2xl font-body text-lg text-ink-soft">
        Light I caught and kept. (These are placeholder frames — drop your
        photos into <code className="rounded bg-white/60 px-1">/public/photos</code>{" "}
        and they&apos;ll slot right in.)
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-6">
        {photos.map((p, i) => (
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
              {p.src ? (
                <Image
                  src={p.src}
                  alt={p.caption}
                  fill
                  className="object-cover"
                  sizes="208px"
                />
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${p.gradient}`}
                >
                  <span className="text-3xl opacity-70">✦</span>
                </div>
              )}
            </div>
            <figcaption className="mt-3 text-center font-hand text-xl text-ink-soft">
              {p.caption}
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </PageShell>
  );
}
