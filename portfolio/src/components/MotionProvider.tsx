"use client";

import { LazyMotion } from "framer-motion";

/**
 * Animation, minus the download.
 *
 * Every page used to ship the whole framer-motion runtime before it could
 * render, because `m.div` carries its features with it. `m` is the same
 * component with the features left behind; this provider fetches them once the
 * page is already interactive. Nothing that was visible without JavaScript
 * becomes invisible: the elements that animate in were waiting on hydration
 * either way.
 */
const loadFeatures = () => import("./motionFeatures").then((mod) => mod.default);

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={loadFeatures}>{children}</LazyMotion>;
}
