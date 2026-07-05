import type { Metadata } from "next";
import UnderTheHoodArticle from "@/components/UnderTheHoodArticle";
import { getCopy } from "@/lib/siteCopy";
import { copyToHtml } from "@/lib/copyRender";

export const metadata: Metadata = {
  title: "The Data Science Hiding in My Portfolio",
  description:
    "A tour of the ML and LLM pipelines behind this site: RAG chatbot, semantic search, the embeddings galaxy, zero-shot blog tagging, CLIP photo clustering, and their evaluations.",
};

// the article's passages are editable in the atelier, render fresh
export const dynamic = "force-dynamic";

export default async function UnderTheHoodPage() {
  const copy = await getCopy();
  const passages = Object.fromEntries(
    Object.entries(copy)
      .filter(([id]) => id.startsWith("tour."))
      .map(([id, text]) => [id, copyToHtml(text)]),
  );
  return (
    <UnderTheHoodArticle
      passages={passages}
      titleNode={
        <span className="rich-passage" dangerouslySetInnerHTML={{ __html: passages["tour.title"] ?? "" }} />
      }
    />
  );
}
