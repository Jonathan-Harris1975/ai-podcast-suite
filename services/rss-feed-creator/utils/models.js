// services/rss-feed-creator/utils/models.js
// AI Podcast Suite – RSS Feed Rewrite (Gen-X British Style)
// Integrates with the global ai-service for resilient model routing.

import { resilientRequest } from "../../../utils/ai-service.js";
import { rewritePrompt, SYSTEM } from "./rss-prompts.js";

/**
 * Rewrite a single RSS feed item using the route-based AI service.
 * @param {string} title - Original article title
 * @param {string} summary - Original article summary
 * @returns {Promise<string>} - Rewritten article text
 */
export async function rewriteItem(title, summary) {
  console.log("✅ ai-service import resolved, rewriting item:", title?.slice(0, 60));

  const prompt = rewritePrompt({ title, summary });

  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: prompt },
  ];

  try {
    // 🔄 Route models dynamically via ai-service
    const response = await resilientRequest("rssRewrite", messages);
    return typeof response === "string" ? response.trim() : JSON.stringify(response);
  } catch (err) {
    console.error("❌ rewriteItem error:", err.message);
    throw err;
  }
}
