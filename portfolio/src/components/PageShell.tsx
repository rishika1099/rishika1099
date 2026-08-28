import Scenery, { type Vibe } from "./Scenery";

/**
 * The frame every page sits in.
 *
 * The entrance used to be a framer-motion fade from `opacity: 0`, which meant
 * the entire contents of every page were invisible until React had downloaded,
 * hydrated, and started animating. Nothing could count as the largest paint
 * before all of that finished. It rises with a CSS transform now: the animation
 * starts the moment the HTML parses, needs no JavaScript at all, and because it
 * never touches opacity the text is on screen from the first frame.
 */
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
    <div className={`relative min-h-screen vibe-${vibe}`}>
      <Scenery vibe={vibe} />
      <div className={`page-rise mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8 ${className}`}>
        {children}
      </div>
    </div>
  );
}
