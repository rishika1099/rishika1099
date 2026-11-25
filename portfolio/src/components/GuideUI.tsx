import { connection } from "next/server";
import { getCopy } from "@/lib/siteCopy";
import { FeatureCopy } from "./FeatureCopy";
import DeferredUI from "./DeferredUI";

export default async function GuideUI() {
  await connection();
  const copy = await getCopy();
  const chatCopy = Object.fromEntries(Object.entries(copy).filter(([key]) => key.startsWith("chat.")));
  return <FeatureCopy copy={chatCopy}><DeferredUI /></FeatureCopy>;
}
