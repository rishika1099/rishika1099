"use client";

import { motion } from "framer-motion";

export default function PageTitle({
  children,
  className = "text-ink",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.h1
      animate={{ y: [0, -7, 0], rotate: [-1, 1, -1] }}
      transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
      style={{ fontFamily: "var(--font-halimun)" }}
      className={`inline-block text-3xl font-normal leading-tight text-shadow-soft sm:text-4xl ${className}`}
    >
      {children}
    </motion.h1>
  );
}
