// /services/rss-feed-creator/utils/models.js
// Unified OpenRouter model interface for Rewrite Pipeline
// Uses the existing ai-service resilientRequest() logic

import { resilientRequest } from "../../ai-service.js";
import { aiConfig } from "../../ai-config.js";

// Structured log output (Render/Shiper friendly)
function safeLog(level, message, meta = undefined) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...(meta && { meta }),
  };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

/**
 * Calls the resilientRequest() for rewriting operations.
 * Uses the 'compose' route sequence: [deepseek, grok, google]
 * @param {string} prompt - the text prompt to send
 */
export async function callOpenRouterModel(prompt) {
  try {
    const messages = [
      {
        role: "system",
        content:
          "You are a British Gen-X AI editor. Rewrite AI news headlines concisely with clarity, dry wit, and no hype.",
      },
      { role: "user", content: prompt },
    ];

    // Use the 'compose' model route sequence defined in ai-config.js
    const result = await resilientRequest("compose", messages);
    safeLog("info", "✅ Rewrite completed", { length: result?.length || 0 });
    return result;
  } catch (err) {
    safeLog("error", "❌ callOpenRouterModel failed", { error: err.message });
    throw err;
  }
}

/**
 * Build the rewrite prompt (mirrors pipeline usage)
 */
export function buildRewritePrompt(title, summary) {
  return (
    `Rewrite this AI news item in a concise British Gen-X tone.\n\n` +
    `Title: ${title}\n` +
    `Summary: ${summary}\n\n` +
    `Keep it factual, punchy, and dry. No hype, emojis, or hashtags.`
  );
}
