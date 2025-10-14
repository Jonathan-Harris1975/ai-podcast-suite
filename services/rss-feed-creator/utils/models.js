// services/rss-feed-creator/utils/models.js
// Integrates with global ai-service for resilient LLM routing

import { resilientRequest } from "../../../utils/ai-service.js";
import { rewritePrompt, SYSTEM } from "./rss-prompts.js";

/**
 * Rewrite a single RSS item using the route-based LLM service.
 * @param {string} title - Original article title
 * @param {string} summary - Original article summary
 * @returns {Promise<string>} - Rewritten article text
 */
export async function rewriteItem(title, summary) {
  const prompt = rewritePrompt({ title, summary });

  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: prompt },
  ];

  // 🔄 Route models dynamically via ai-service
  return await resilientRequest("rssRewrite", messages);
}
