"use client";

import { motion } from "framer-motion";
import Scenery, { type Vibe } from "./Scenery";

export default function PageShell({
  vibe,
  children,
  className = "",
}: {
  vibe: Vibe;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative min-h-screen">
      <Scenery vibe={vibe} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8 ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
