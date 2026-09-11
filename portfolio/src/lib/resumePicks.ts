// The resume lines a role calls for, chosen once per role and kept.
//
// A pasted posting has always come back with the few resume lines that answer
// it. The role tiles ask the same question in advance and got nothing, so a
// recruiter who clicked "Data Scientist" never saw the lines one who pasted a
// data science posting would have. This gives the tiles the same answer, by
// the same rule.
//
// Selection, never writing. The model is handed her resume as numbered entries
// with numbered bullets and answers with indices; an index that does not exist
// is dropped. Chosen once per role, since the roles are fixed, and chosen again
// only when the resume or the role changes.

import OpenAI from "openai";
import { getResumeTex } from "@/lib/resumeSource";
import { parseResumeTex } from "@/lib/resumeTex";
import { flattenResume, type TailoredEntry } from "@/lib/tailor";
import { ROLES, ROLE_SPECS, type Role } from "@/lib/recruiter";
import { putStore, readStore, srcHash } from "@/lib/genCache";

const STORE = "resume-picks";
// bumped when the prompt changes, so every role is chosen again
const VERSION = "2";

// A tile's view already carries projects, research, experience, education and
// skills, so it gets less than a posting does: three entries, three lines each.
const MAX_ENTRIES = 3;
const MAX_BULLETS = 3;

function isEntries(v: unknown): v is TailoredEntry[] {
  return (
    Array.isArray(v) &&
    v.every(
      (e) =>
        !!e &&
        typeof e === "object" &&
        typeof (e as TailoredEntry).title === "string" &&
        Array.isArray((e as TailoredEntry).bullets),
    )
  );
}

export async function resumeForRole(role: Role): Promise<TailoredEntry[]> {
  const tex = await getResumeTex();
  const { flat } = flattenResume(parseResumeTex(tex));
  if (!process.env.OPENAI_API_KEY || !flat.length) return [];

  const spec = ROLE_SPECS[role];
  const others = ROLES.filter((r) => r !== role).map((r) => ROLE_SPECS[r].label);
  const source = srcHash(
    [VERSION, tex, spec.label, spec.areas.join(","), spec.skills.join(",")].join("|"),
  );
  const key = `role-${role}`;
  const hit = (await readStore(STORE))[key];
  if (hit?.src === source) {
    try {
      const parsed: unknown = JSON.parse(hit.text);
      if (isEntries(parsed)) return parsed;
    } catch {
      // unreadable: choose again
    }
  }

  const openai = new OpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          `Someone is hiring ${spec.article}. The role is judged on: ${spec.skills.join(", ")}. Its work centres on: ${spec.areas.join(", ")}.`,
          "You are given a candidate's real resume, parsed into numbered entries, each with numbered bullets.",
          // The first version asked for the strongest evidence for the role,
          // and got the strongest lines in general: ML Engineer and Software
          // Engineer were handed identical lines, and so were FDE and AI
          // Product Manager, so switching tiles changed nothing.
          `Choose the lines that argue for this role in particular. The candidate's strongest lines in general are not the point: a line that would be just as strong for any engineering or data role counts for less than one that speaks to what this role alone is judged on. The same page offers ${others.join(", ")}, each with its own selection, so favour what sets ${spec.label} apart from them.`,
          `Choose at most ${MAX_ENTRIES} entries, strongest first, and for each at most ${MAX_BULLETS} of its bullets by index, in the order they should be read. Prefer a bullet with a concrete result over one that only describes a duty.`,
          "You are selecting, not writing: never invent an entry, a bullet or a number.",
          'Return JSON {"picks": [{"entry": 0, "bullets": [0, 2]}]}.',
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          role: spec.label,
          areas: spec.areas,
          skills: spec.skills,
          entries: flat.map((e, i) => ({
            i,
            section: e.section,
            title: e.title,
            meta: e.meta,
            bullets: e.bullets.map((b, j) => ({ j, text: b })),
          })),
        }),
      },
    ],
  });

  const picks: TailoredEntry[] = [];
  try {
    const o = JSON.parse(res.choices[0]?.message?.content ?? "{}") as { picks?: unknown };
    const seen = new Set<number>();
    for (const raw of Array.isArray(o.picks) ? o.picks : []) {
      const p = raw as { entry?: unknown; bullets?: unknown };
      const idx = typeof p.entry === "number" ? p.entry : -1;
      const src = flat[idx];
      // an index we do not recognise is an entry it invented; a repeat adds nothing
      if (!src || seen.has(idx)) continue;
      seen.add(idx);
      const bullets = (Array.isArray(p.bullets) ? p.bullets : [])
        .filter((b): b is number => typeof b === "number")
        .filter((j, k, all) => all.indexOf(j) === k)
        .map((j) => src.bullets[j])
        .filter(Boolean)
        .slice(0, MAX_BULLETS);
      picks.push({ ...src, bullets: bullets.length ? bullets : src.bullets.slice(0, 2) });
      if (picks.length === MAX_ENTRIES) break;
    }
  } catch {
    // an unreadable answer is treated as no choice
  }

  // Kept even when empty. An empty choice left uncached would send every
  // visit to that role back to the model; kept, it waits for the resume to
  // change, or for the atelier's "write it again".
  await putStore(STORE, key, { src: source, text: JSON.stringify(picks) });
  return picks;
}
