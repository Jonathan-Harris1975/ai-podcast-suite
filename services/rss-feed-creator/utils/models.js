// utils/models.js
import fetch from "node-fetch";
import { log } from "../../../utils/logger.js";

export const MODELS = {
  google:    { key: process.env.OPENROUTER_API_KEY_GOOGLE,    model: "google/gemini-2.0-flash-001" },
  chatgpt:   { key: process.env.OPENROUTER_API_KEY_CHATGPT,   model: "openai/gpt-4o-mini" },
  deepseek:  { key: process.env.OPENROUTER_API_KEY_DEEPSEEK,  model: "deepseek/deepseek-chat" },
  anthropic: { key: process.env.OPENROUTER_API_KEY_ANTHROPIC, model: "anthropic/claude-sonnet-4.5" },
  meta:      { key: process.env.OPENROUTER_API_KEY_META,      model: "meta-llama/llama-4-scout" }
};

export async function callOpenRouterModel(url, content, title = null) {
  for (const [id, { key, model }] of Object.entries(MODELS)) {
    if (!key) {
      log.warn({ id }, "⚠️ Skipping model - no API key set");
      continue;
    }

    try {
      log.info({ id, model }, "🔮 Calling OpenRouter model");

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are a sarcastic British Gen X podcaster rewriting RSS articles for a newsletter + podcast. Keep it sharp, cynical, conversational, but factual."
            },
            {
              role: "user",
              content: `Rewrite this article as a single continuous blurb (minimum 250 characters, maximum 600 characters). 
- No formatting, no bullet points, no 'Podcast Intro', no headings.
- Must be JSON-safe plain text. 
- Tone: sarcastic British Gen X, conversational, punchy, witty.
- Only return the rewritten article text.

Title: ${title || "Untitled"}
URL: ${url}
Content: ${content.slice(0, 4000)}`
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const rewritten = data.choices?.[0]?.message?.content;

      if (rewritten) {
        log.info({ id, model }, "✅ Rewrite succeeded");
        return rewritten;
      } else {
        log.warn({ id }, "⚠️ Model returned empty content, trying next");
      }
    } catch (err) {
      log.error({ id, err }, "❌ Model call failed, trying next");
    }
  }

  throw new Error("All OpenRouter models failed");
}
