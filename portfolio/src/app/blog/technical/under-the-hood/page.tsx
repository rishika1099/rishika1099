import type { Metadata } from "next";
import UnderTheHoodArticle from "@/components/UnderTheHoodArticle";

export const metadata: Metadata = {
  title: "The Data Science Hiding in My Portfolio",
  description:
    "A tour of the ML and LLM pipelines behind this site: RAG chatbot, semantic search, the embeddings galaxy, zero-shot blog tagging, CLIP photo clustering, and their evaluations.",
};

export default function UnderTheHoodPage() {
  return <UnderTheHoodArticle />;
}
