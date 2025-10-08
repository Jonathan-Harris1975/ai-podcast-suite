// utils/models.js
import fetch from "node-fetch";
import { log } from "../../../utils/logger.js";

export async function callOpenRouterModel({ id, model, prompt, apiKey }) {
  try {
    log.info(`🔮 Calling OpenRouter model [${id}]`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();

    // Safely extract text
    const message =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      null;

    if (!message) {
      log.error(`❌ No message content returned from OpenRouter (${model})`);
      return { success: false, text: null };
    }

    // Return truncated output safely
    const safeText = message.length > 8000 ? message.slice(0, 8000) : message;

    log.info(`✅ Received response from ${model} (${safeText.length} chars)`);
    return { success: true, text: safeText };
  } catch (err) {
    log.error(`❌ callOpenRouterModel failed for ${model}: ${err.message}`);
    return { success: false, text: null };
  }
}
