import type { Metadata } from "next";
import EvalsDashboard from "@/components/EvalsDashboard";

export const metadata: Metadata = {
  title: "Evaluations",
  description:
    "Live scoreboard for the ML features on this site: RAG chatbot eval, semantic search rankings, photo clustering silhouette, and poem mood confidence.",
};

export default function EvalsPage() {
  return <EvalsDashboard />;
}
