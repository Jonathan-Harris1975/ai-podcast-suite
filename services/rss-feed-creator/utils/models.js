/**
 * Centralized model + routing config for the RSS Feed Creator.
 * Mirrors ai-config/ai-service logic from the script system,
 * with real OpenRouter setup, resilient fallback, and final summary reporting.
 */

import OpenAI from "openai";
import process from "node:process";

/**
 * Structured JSON logger (for Shiper logs).
 */
function log(level, message, meta = null) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

/**
 * Configuration — OpenRouter model chain.
 */
const aiConfig = {
  models: {
    chatgpt: {
      name: "openai/gpt-4o-mini",
      apiKey: process.env.OPENROUTER_API_KEY_CHATGPT,
    },
    google: {
      name: "google/gemini-2.0-flash-001",
      apiKey: process.env.OPENROUTER_API_KEY_GOOGLE,
    },
    deepseek: {
      name: "deepseek/deepseek-chat",
      apiKey: process.env.OPENROUTER_API_KEY_DEEPSEEK,
    },
    grok: {
      name: "anthropic/claude-sonnet-4.5",
      apiKey: process.env.OPENROUTER_API_KEY_GROK,
    },
    meta: {
      name: "meta-llama/llama-4-scout",
      apiKey: process.env.OPENROUTER_API_KEY_META,
    },
  },

  routeModels: {
    rewrite: ["chatgpt", "google", "deepseek", "grok", "meta"],
  },

  commonParams: {
    temperature: 0.65,
    timeout: 40000,
  },

  headers: {
    "HTTP-Referer": process.env.APP_URL || "https://puzzledpancake.on.shiper.app",
    "X-Title": "RSS Feed Rewriter",
  },
};

/**
 * Calls the OpenRouter API with automatic fallback and final summary.
 * @param {string} title - The title of the article.
 * @param {string} url - The URL of the article.
 * @param {string} content - The content of the article.
 * @returns {Promise<string>} - The rewritten text.
 */
export async function callOpenRouterModel(title, url, content) {
  const sequence = aiConfig.routeModels.rewrite;
  const startTime = Date.now();
  const results = [];

  let lastError = null;
  let successModel = null;
  let rewrittenContent = "";

  for (const key of sequence) {
    const model = aiConfig.models[key];
    if (!model?.name || !model?.apiKey) {
      results.push({ model: key, status: "skipped", reason: "missing_config_or_key" });
      log("warn", `⚠️ Model '${key}' missing config or API key.`);
      continue;
    }

    log("info", `🤖 Trying model ${model.name}`);

    try {
      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: model.apiKey,
        defaultHeaders: aiConfig.headers,
      });

      const completion = await openai.chat.completions.create({
        model: model.name,
        messages: [
          {
            role: "system",
            content:
              "You are a concise, witty AI journalist rewriting AI news headlines and summaries in a dry British Gen-X tone. Avoid hype. Focus on clarity and insight.",
          },
          {
            role: "user",
            content: `Rewrite this article as a single continuous blurb (minimum 250 characters, maximum 600 characters). \n- No formatting, no bullet points, no 'Podcast Intro', no headings.\n- Must be JSON-safe plain text. \n- Tone: sarcastic British Gen X, conversational, punchy, witty.\n- Only return the rewritten article text.\n\nTitle: ${title || "Untitled"}\nURL: ${url}\nContent: ${content.slice(0, 4000)}`,
          },
        ],
        temperature: aiConfig.commonParams.temperature,
        timeout: aiConfig.commonParams.timeout,
        max_tokens: 300,
      });

      rewrittenContent = completion?.choices?.[0]?.message?.content?.trim();
      if (!rewrittenContent) throw new Error("Empty response");

      results.push({ model: model.name, status: "success" });
      successModel = model.name;
      log("info", `✅ Success with ${model.name}`);
      break;
    } catch (err) {
      const reason =
        err?.response?.statusText ||
        err?.message ||
        "unknown error";
      results.push({ model: model.name, status: "failed", reason });
      log("error", `❌ Failed with ${model.name}`, { error: reason });
      lastError = err;

      // backoff 800ms
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  // ── Summary Log ─────────────────────────────
  const summary = {
    ok: !!successModel,
    successModel,
    attempts: results.length,
    duration_sec: parseFloat(elapsed),
    results,
  };

  log("summary", "🧾 OpenRouter RSS Rewrite Summary", summary);

  if (!successModel) {
    log("error", "🚨 All OpenRouter models failed for RSS rewrite", {
      lastError: lastError?.message,
    });
    throw lastError || new Error("All OpenRouter models failed");
  }

  return rewrittenContent;
}

