"use client";

import { useEffect, useState } from "react";

type Scope = "admin" | "stats";

/**
 * The door to the private rooms.
 *
 * On the live site: the key, then a six-digit code emailed to her, which opens a
 * session cookie for a day. The key is never kept in the browser. On her own
 * machine: the key alone, remembered in localStorage, exactly as before.
 *
 * Renders its children with the value the room's requests should send. Locally
 * that is the key; live it is only a placeholder, since the cookie does the work.
 */
export default function OwnerLogin({
  scope,
  storageKey,
  dark = false,
  shell,
  children,
}: {
  scope: Scope;
  /** where the key is remembered on her own machine */
  storageKey: string;
  /** light text, for the stats room's night sky */
  dark?: boolean;
  /** wraps the door (not the room) for pages whose own shell only appears once open */
  shell?: (door: React.ReactNode) => React.ReactNode;
  children: (key: string, signOut: () => void) => React.ReactNode;
}) {
  const [mode, setMode] = useState<"checking" | "local" | "live">("checking");
  const [key, setKey] = useState("");
  const [open, setOpen] = useState(false);
  const [challenge, setChallenge] = useState<{ id: string; sentTo: string; minutes: number } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let live = true;
    fetch("/api/auth/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { mode: "local" | "live"; scopes: Scope[] }) => {
        if (!live) return;
        setMode(d.mode);
        try {
          if (d.mode === "live") {
            // a key saved by the old login is a secret sitting in the browser
            localStorage.removeItem("admin-key");
            localStorage.removeItem("stats-key");
            if (d.scopes.includes(scope)) {
              localStorage.setItem("no-track", "1");
              setKey("session");
              setOpen(true);
            }
          } else {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
              setKey(saved);
              setOpen(true);
            }
          }
        } catch {
          // storage blocked: just ask
        }
      })
      .catch(() => live && setMode("live"));
    return () => {
      live = false;
    };
  }, [scope, storageKey]);

  const say = (e: string) => {
    const words: Record<string, string> = {
      "wrong-key": "that's not the key 🌙",
      "slow-down": "too many tries. wait fifteen minutes, then try again",
      "not-sent": "the code could not be emailed. try again in a minute",
      unconfigured: "the key isn't configured on this deploy yet",
      "wrong-code": "that code isn't right",
      expired: "that code has expired. send a new one",
      "used-up": "too many wrong codes. send a new one",
      "no-session-secret": "SESSION_SECRET isn't set on this deploy",
    };
    setErr(words[e] ?? "something wobbled, try again?");
  };

  async function sendKey() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      const d = await res.json();
      if (!res.ok) return say(d.error);
      if (d.mode === "local") {
        if (!(d.scopes as Scope[]).includes(scope)) return say("wrong-key");
        try {
          localStorage.setItem(storageKey, key.trim());
        } catch {}
        setKey(key.trim());
        setOpen(true);
        return;
      }
      setChallenge({ id: d.challenge, sentTo: d.sentTo, minutes: d.minutes });
      setCode("");
    } catch {
      say("");
    } finally {
      setBusy(false);
    }
  }

  async function sendCode() {
    if (!challenge) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge: challenge.id, code }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.error === "wrong-code" && typeof d.triesLeft === "number") {
          return setErr(`that code isn't right (${d.triesLeft} ${d.triesLeft === 1 ? "try" : "tries"} left)`);
        }
        if (d.error === "expired" || d.error === "used-up") setChallenge(null);
        return say(d.error);
      }
      if (!(d.scopes as Scope[]).includes(scope)) {
        setChallenge(null);
        return say("wrong-key");
      }
      try {
        // her own visits stay out of the numbers
        localStorage.setItem("no-track", "1");
      } catch {}
      setKey("session");
      setOpen(true);
    } catch {
      say("");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    if (mode === "live") void fetch("/api/auth/logout", { method: "POST" });
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setOpen(false);
    setChallenge(null);
    setKey("");
    setCode("");
  }

  if (open) return <>{children(key, signOut)}</>;
  if (mode === "checking") return <>{shell ? shell(null) : null}</>;

  const field =
    "w-full rounded-full border border-white/70 bg-white/80 px-5 py-2.5 font-body text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30";
  const button =
    "shrink-0 rounded-full bg-ink px-6 py-2.5 font-body font-semibold text-cream transition hover:opacity-90 disabled:opacity-60";
  const note = `mt-3 text-center font-body text-sm ${dark ? "text-cream/75" : "text-ink-soft"}`;

  const door = (
    <div className="mx-auto mt-8 max-w-md">
      {!challenge ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (key.trim()) void sendKey();
          }}
        >
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="the key"
            autoComplete="current-password"
            className={field}
          />
          <button type="submit" disabled={busy} className={button}>
            {busy ? "…" : "open"}
          </button>
        </form>
      ) : (
        <>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) void sendCode();
            }}
          >
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="the 6-digit code"
              className={`${field} tracking-[0.3em]`}
            />
            <button type="submit" disabled={busy || code.length !== 6} className={button}>
              {busy ? "…" : "enter"}
            </button>
          </form>
          <p className={note}>
            a code went to {challenge.sentTo}. it works once, for {challenge.minutes} minutes ✦
          </p>
          <p className={note}>
            <button
              type="button"
              onClick={() => {
                setChallenge(null);
                setErr("");
              }}
              className="underline underline-offset-4"
            >
              start again
            </button>
          </p>
        </>
      )}
      {err && <p className="mt-3 text-center font-body text-sm text-rose-500">{err}</p>}
    </div>
  );
  return <>{shell ? shell(door) : door}</>;
}
