import type { Pipeline } from "@/lib/pipeline";

/**
 * The pipeline, drawn as inline SVG in the site's own pastels.
 *
 * Inline rather than a chart library: it is five rounded boxes and four arrows,
 * which is not worth a dependency, and drawing it by hand means it can wear the
 * same colours as the chips on the card above it. Inline SVG also renders on the
 * server, so it is in the HTML with no client JavaScript at all.
 */

// the same pastels the category chips use, cycled so adjacent stages differ
const FILLS = ["#e6d7f5", "#cfe8f3", "#bfe9d6", "#f7d9c4", "#f5c9e0", "#d8e8c8"];

export default function PipelineDiagram({
  pipeline,
  label,
}: {
  pipeline: Pipeline;
  label: string;
}) {
  const steps = pipeline.steps;
  const W = 900;
  const GAP = 22;
  const H = 92;
  const boxW = (W - GAP * (steps.length - 1)) / steps.length;

  return (
    <figure className="mt-5 rounded-2xl bg-white/55 p-4 ring-1 ring-white/70">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`How ${label} works: ${steps.join(", then ")}`}
        className="w-full"
      >
        {steps.map((s, i) => {
          const x = i * (boxW + GAP);
          return (
            <g key={`${s}-${i}`}>
              <rect
                x={x}
                y={18}
                width={boxW}
                height={56}
                rx={16}
                fill={FILLS[i % FILLS.length]}
              />
              <text
                x={x + boxW / 2}
                y={46}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#4a4a5e"
                style={{ font: "600 15px var(--font-body), system-ui, sans-serif" }}
              >
                {/* long labels wrap by hand: SVG text does not */}
                {wrap(s).map((line, j, all) => (
                  <tspan key={line} x={x + boxW / 2} dy={j === 0 ? (all.length > 1 ? -8 : 0) : 17}>
                    {line}
                  </tspan>
                ))}
              </text>
              {i < steps.length - 1 && (
                <path
                  d={`M ${x + boxW + 5} 46 L ${x + boxW + GAP - 6} 46`}
                  stroke="#a9a8bd"
                  strokeWidth={2}
                  strokeLinecap="round"
                  markerEnd="url(#pipeline-arrow)"
                />
              )}
            </g>
          );
        })}
        <defs>
          <marker
            id="pipeline-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#a9a8bd" />
          </marker>
        </defs>
      </svg>
      <figcaption className="mt-2 text-center font-body text-[11px] text-ink-soft/70">
        how it works, read from the repo ✦
      </figcaption>
    </figure>
  );
}

/** Two lines at most: the boxes are wide but not that wide. */
function wrap(s: string): string[] {
  if (s.length <= 16) return [s];
  const words = s.split(" ");
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")].filter(Boolean);
}
