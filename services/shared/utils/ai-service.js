import fetch from "node-fetch";
import { OPENROUTER_BASE_URL, OPENROUTER_HEADERS, MODELS } from "./ai-config.js";
import { log } from "./logger.js";

export async function callOpenRouterModel(prompt, { temperature = 0.35, max_tokens = 240 } = {}) {
  let lastErr = null;
  for (const model of MODELS) {
    try {
      const resp = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: OPENROUTER_HEADERS,
        body: JSON.stringify({
          model,
          temperature,
          max_tokens,
          messages: [
            { role: "system", content: "You are a precise rewriting assistant. Keep outputs concise, factual, and 200–400 characters." },
            { role: "user", content: prompt }
          ]
        })
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`HTTP ${resp.status} ${resp.statusText} — ${text}`);
      }
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("Empty completion");
      return content;
    } catch (err) {
      lastErr = err;
      log("⚠️ OpenRouter model failed; falling back", { model, error: err.message });
      continue;
    }
  }
  throw lastErr || new Error("All OpenRouter models failed");
}
