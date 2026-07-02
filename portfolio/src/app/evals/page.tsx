import type { Metadata } from "next";
import EvalsDashboard from "@/components/EvalsDashboard";

export const metadata: Metadata = {
  title: "Evaluations",
  description:
    "Live scoreboard for the ML features on this site: RAG chatbot evaluation, semantic search rankings, and photo clustering quality.",
};

export default function EvalsPage() {
  return <EvalsDashboard />;
}
