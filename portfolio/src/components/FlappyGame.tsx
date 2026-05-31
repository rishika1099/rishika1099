"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const W = 320;
const H = 440;
const GRAVITY = 0.42;
const FLAP = -7;
const PIPE_W = 54;
const GAP = 168;
const SPEED = 2.3;
const SPAWN = 200; // horizontal px between obstacles
const COMET_X = 80;
const COMET_R = 14;
const TARGET = 5;

const PLANETS = ["🪐", "🌍", "🌕", "🌖", "🔴"];

type Pipe = { x: number; gapY: number; passed: boolean; planet: string };
type Star = { x: number; y: number; r: number; tw: number };
type Phase = "idle" | "playing" | "over" | "won";

export default function FlappyGame({ onWin }: { onWin: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);

  const game = useRef({
    y: H / 2,
    v: 0,
    t: 0,
    pipes: [] as Pipe[],
    stars: [] as Star[],
    raf: 0,
    phase: "idle" as Phase,
    score: 0,
  });

  // build a faint starfield once (background sparkle)
  if (game.current.stars.length === 0) {
    for (let i = 0; i < 42; i++) {
      game.current.stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.3 + 0.3,
        tw: Math.random() * Math.PI * 2,
      });
    }
  }

  const reset = useCallback(() => {
    game.current.y = H / 2;
    game.current.v = 0;
    game.current.pipes = [
      { x: W + 40, gapY: H / 2, passed: false, planet: PLANETS[0] },
    ];
    game.current.score = 0;
    setScore(0);
  }, []);

  const flap = useCallback(() => {
    const g = game.current;
    if (g.phase === "idle" || g.phase === "over") {
      reset();
      g.phase = "playing";
      setPhase("playing");
    }
    if (g.phase === "playing") g.v = FLAP;
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const g = game.current;
      g.t += 1;

      if (g.phase === "playing") {
        g.v += GRAVITY;
        g.y += g.v;

        for (const p of g.pipes) p.x -= SPEED;
        const last = g.pipes[g.pipes.length - 1];
        if (last && last.x < W - SPAWN) {
          g.pipes.push({
            x: W + PIPE_W,
            gapY: 110 + Math.random() * (H - 220),
            passed: false,
            planet: PLANETS[Math.floor(Math.random() * PLANETS.length)],
          });
        }
        g.pipes = g.pipes.filter((p) => p.x + PIPE_W > -10);

        for (const p of g.pipes) {
          if (!p.passed && p.x + PIPE_W < COMET_X) {
            p.passed = true;
            g.score += 1;
            setScore(g.score);
            if (g.score >= TARGET) {
              g.phase = "won";
              setPhase("won");
              onWin();
            }
          }
        }

        const hitEdge = g.y + COMET_R > H || g.y - COMET_R < 0;
        let hitPlanet = false;
        for (const p of g.pipes) {
          if (COMET_X + COMET_R > p.x && COMET_X - COMET_R < p.x + PIPE_W) {
            if (
              g.y - COMET_R < p.gapY - GAP / 2 ||
              g.y + COMET_R > p.gapY + GAP / 2
            )
              hitPlanet = true;
          }
        }
        if (hitEdge || hitPlanet) {
          g.phase = "over";
          setPhase("over");
        }
      }

      // ---- deep-space background ----
      const space = ctx.createLinearGradient(0, 0, 0, H);
      space.addColorStop(0, "#1b1538");
      space.addColorStop(0.55, "#2a1f52");
      space.addColorStop(1, "#3a2a63");
      ctx.fillStyle = space;
      ctx.fillRect(0, 0, W, H);

      // faint twinkling background stars
      for (const s of g.stars) {
        const a = 0.35 + 0.55 * Math.abs(Math.sin(g.t * 0.03 + s.tw));
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "#fdf6ff";
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // obstacle columns: a planet at the gap edge, ✨ stars trailing to the rim
      for (const p of g.pipes) {
        const cx = p.x + PIPE_W / 2;
        drawColumn(ctx, cx, p.gapY - GAP / 2, -1, p.planet);
        drawColumn(ctx, cx, p.gapY + GAP / 2, 1, p.planet);
      }

      // comet ☄️ player — gentle tilt with velocity
      const cy = g.y;
      ctx.save();
      ctx.translate(COMET_X, cy);
      ctx.rotate(Math.max(-0.4, Math.min(0.5, g.v * 0.04)));
      ctx.scale(-1, 1); // flip so the tail trails behind the rightward flight
      ctx.shadowColor = "rgba(206,180,240,0.9)";
      ctx.shadowBlur = 16;
      ctx.font = "30px serif";
      ctx.fillText("☄️", 0, 0);
      ctx.restore();
      ctx.shadowBlur = 0;

      g.raf = requestAnimationFrame(loop);
    };

    game.current.raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(game.current.raf);
  }, [onWin]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "ArrowUp") {
        e.preventDefault();
        if (game.current.phase !== "won") flap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flap]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={() => phase !== "won" && flap()}
          className="cursor-pointer rounded-[1.5rem] border border-white/30 shadow-lg"
          style={{ maxWidth: "100%", height: "auto", touchAction: "none" }}
        />

        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-white/15 px-4 py-1 font-display text-sm font-semibold text-cream backdrop-blur-sm">
          {score} / {TARGET} ✦
        </div>

        {phase === "idle" && (
          <Overlay>
            <p className="font-display text-xl font-bold text-cream">
              steer the comet ☄️
            </p>
            <p className="mt-1 font-body text-base text-cream/80">
              tap / space to drift past {TARGET} planets 🪐 & find the key
            </p>
            <p className="mt-3 font-body text-sm text-cream/70">tap to begin</p>
          </Overlay>
        )}

        {phase === "over" && (
          <Overlay>
            <p className="font-display text-xl font-bold text-cream">
              caught by gravity 🪐
            </p>
            <p className="mt-1 font-body text-base text-cream/80">
              you cleared {score}. tap to launch again ✦
            </p>
          </Overlay>
        )}
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[1.5rem] bg-twilight/45 px-6 text-center backdrop-blur-[2px]">
      {children}
    </div>
  );
}

// draws a blocking column from a gap edge out to the canvas rim:
// a planet emoji sits at the gap, ✨ stars trail toward the edge.
// dir = -1 builds upward (top column), dir = 1 builds downward (bottom).
function drawColumn(
  ctx: CanvasRenderingContext2D,
  cx: number,
  edgeY: number,
  dir: 1 | -1,
  planet: string,
) {
  // planet hugging the gap
  ctx.font = "30px serif";
  ctx.fillText(planet, cx, edgeY + dir * 18);

  // ✨ stars stepping out to the rim
  ctx.font = "20px serif";
  const limit = dir === -1 ? -10 : H + 10;
  let y = edgeY + dir * 48;
  for (let i = 0; dir === -1 ? y > limit : y < limit; i++) {
    const wob = Math.sin((y + cx) * 0.05) * 6;
    ctx.fillText(i % 2 === 0 ? "✨" : "⭐", cx + wob, y);
    y += dir * 30;
  }
}
