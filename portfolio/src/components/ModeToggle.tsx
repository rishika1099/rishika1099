"use client";

import { motion } from "framer-motion";
import { useMode } from "@/components/ModeProvider";

export default function ModeToggle() {
  const { mode, toggle } = useMode();
  const recruiter = mode === "recruiter";
  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.94 }}
      aria-label={recruiter ? "switch to curious mode" : "switch to recruiter mode"}
      title={recruiter ? "tap for the whimsical version" : "tap for the recruiter version"}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-xs font-bold transition ${
        recruiter ? "bg-ink text-cream" : "bg-lavender/70 text-ink hover:bg-lavender"
      }`}
    >
      <span className="text-sm">{recruiter ? "👀" : "🌷"}</span>
      <span className="hidden sm:inline">{recruiter ? "recruiter" : "curious"}</span>
    </motion.button>
  );
}
