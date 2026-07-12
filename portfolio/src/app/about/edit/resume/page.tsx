"use client";

import { AdminGate } from "@/components/editing";
import ResumeLatexEditor from "@/components/ResumeLatexEditor";

// Secret LaTeX resume editor, gated by the admin key like the other edit rooms.
export default function ResumeLatexEditPage() {
  return <AdminGate>{(key) => <ResumeLatexEditor keyVal={key} />}</AdminGate>;
}
