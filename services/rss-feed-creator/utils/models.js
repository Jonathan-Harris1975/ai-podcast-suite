/**
 * Centralized model + routing config for the RSS Feed Creator.
 * Mirrors the ai-config/ai-service logic used by the script system,
 * with real OpenRouter setup and resilient fallback.
 */

const aiConfig = {
  models: {
    google: {
      name: "google/gemini-2.0-flash-001",
      apiKey: process.env.OPENROUTER_API_KEY_GOOGLE,
    },
    chatgpt: {
      name: "openai/gpt-4o-mini",
      apiKey: process.env.OPENROUTER_API_KEY_CHATGPT,
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
    // Simplified route strategy — RSS Feed rewrites are concise, tone-stable
    rewrite: ["google", "chatgpt", "deepseek", "grok", "meta"],
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
 * Logs to stdout with structured JSON for Shiper visibility.
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
 * Generates a rewritten AI summary for an RSS feed item.
 * Automatically retries across models if one fails.
 *
 * @param {string} prompt - The constructed rewrite prompt.
 * @returns {Promise<string>} rewritten content
 */
export async function callOpenRouterModel(prompt) {
  const modelSequence = aiConfig.routeModels.rewrite;
  let lastError = null;

  for (const modelKey of modelSequence) {
    const modelConfig = aiConfig.models[modelKey];

    if (!modelConfig?.name || !modelConfig?.apiKey) {
      log("warn", `⚠️ Model '${modelKey}' missing or no API key.`);
      continue;
    }

    try {
      const client = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: modelConfig.apiKey,
        defaultHeaders: aiConfig.headers,
      });

      log("info", `🤖 Trying model ${modelConfig.name} for RSS rewrite`);

      const completion = await client.chat.completions.create({
        model: modelConfig.name,
        messages: [
          {
            role: "system",
            content:
              "You are a precise and witty AI editor specializing in rewriting news headlines and summaries in a British Gen-X tone. Your goal: produce short, smart, punchy rewrites for an AI news RSS feed. Avoid hype, focus on clarity and insight.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: aiConfig.commonParams.temperature,
      });

      const content = completion.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("Empty content returned");

      log("info", `✅ Success with ${modelConfig.name}`);
      return content;
    } catch (err) {
      log("error", `❌ Failed with ${modelConfig.name}`, { error: err.message });
      lastError = err;
      await new Promise(r => setTimeout(r, 1000)); // backoff
    }
  }

  log("error", "🚨 All OpenRouter models failed for RSS rewrite", {
    lastError: lastError?.message,
  });
  throw lastError;
}
