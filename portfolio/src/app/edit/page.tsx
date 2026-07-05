"use client";

// In-place editor for the home page ("/" means its editor lives at /edit).
// The whole page renders exactly as visitors see it; the greeting and intro
// are editable, the Resume button becomes "Replace Resume", and the portrait
// gets a little replace-photo control.

import HomeClient from "@/components/HomeClient";
import { AdminGate } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";
import { useFileSwap } from "@/components/FileSwap";

function Editor({ keyVal }: { keyVal: string }) {
  const { ready, box, bar, field, preview } = usePassageEditor(
    keyVal,
    ["home.name1", "home.name2", "home.greeting", "home.intro"],
    "/",
  );
  const files = useFileSwap(keyVal);
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <>
      {bar}
      <div className="mx-auto mt-4 max-w-xl">
        {field("home.name1", "name, line 1", "font-name text-3xl text-ink")}
        {field("home.name2", "name, line 2", "font-name text-3xl text-ink")}
      </div>
      {files.msg && (
        <p className="fixed left-1/2 top-32 z-50 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1 font-body text-xs text-ink-soft shadow">
          {files.msg}
        </p>
      )}
      <HomeClient
        name1={preview("home.name1")}
        name2={preview("home.name2")}
        greeting={box("home.greeting", "font-serif text-lg italic text-ink-soft sm:text-xl")}
        intro={box("home.intro", "font-body text-base text-ink-soft sm:text-lg")}
        resumeSlot={
          <span className="flex items-center gap-1.5">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/75 px-5 py-2 font-body text-base font-bold text-ink shadow-sm backdrop-blur transition hover:bg-white">
              📄 Replace Resume
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && files.upload("resume", e.target.files[0])}
              />
            </label>
            {files.has.resume && (
              <button
                type="button"
                title="back to the original resume"
                onClick={() => files.reset("resume")}
                className="rounded-full bg-white/75 px-2.5 py-2 font-body text-sm text-ink-soft shadow-sm transition hover:bg-white"
              >
                ↺
              </button>
            )}
          </span>
        }
        portraitOverlay={
          <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center gap-1.5">
            <label className="cursor-pointer rounded-full bg-white/90 px-3 py-1 font-body text-xs font-semibold text-ink shadow transition hover:bg-white">
              🖼️ replace photo
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && files.upload("portrait", e.target.files[0])}
              />
            </label>
            {files.has.portrait && (
              <button
                type="button"
                title="back to the GitHub photo"
                onClick={() => files.reset("portrait")}
                className="rounded-full bg-white/90 px-2 py-1 font-body text-xs text-ink-soft shadow transition hover:bg-white"
              >
                ↺
              </button>
            )}
          </div>
        }
      />
    </>
  );
}

export default function HomeEdit() {
  return <AdminGate vibe="dawn">{(key) => <Editor keyVal={key} />}</AdminGate>;
}
