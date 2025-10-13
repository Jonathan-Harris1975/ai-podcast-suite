// services/rss-feed-creator/utils/models.js
import { callOpenRouterModel } from "../../shared/utils/ai-service.js";
import { SYSTEM, rewritePrompt } from "./rss-prompts.js";

export async function rewriteItem(title, summary) {
  const prompt = rewritePrompt({ title, summary });
  return callOpenRouterModel(prompt, SYSTEM);
}