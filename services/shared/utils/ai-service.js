// services/shared/utils/ai-service.js
// OpenRouter model selection + failover using your exact env names.
// Node 22 ESM-ready.

import { info, error } from "./logger.js";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

function getModelPlan() {
  const plan = [];
  const env = process.env;

  if (env.OPENROUTER_ANTHROPIC && (env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY_ANTHROPIC)) {
    plan.push({ model: env.OPENROUTER_ANTHROPIC, apiKey: env.OPENROUTER_API_KEY_ANTHROPIC || env.OPENROUTER_API_KEY, hint: "anthropic" });
  }
  if (env.OPENROUTER_CHATGPT && (env.OPENROUTER_API_KEY_CHATGPT || env.OPENROUTER_API_KEY)) {
    plan.push({ model: env.OPENROUTER_CHATGPT, apiKey: env.OPENROUTER_API_KEY_CHATGPT || env.OPENROUTER_API_KEY, hint: "chatgpt" });
  }
  if (env.OPENROUTER_DEEPSEEK && (env.OPENROUTER_API_KEY_DEEPSEEK || env.OPENROUTER_API_KEY)) {
    plan.push({ model: env.OPENROUTER_DEEPSEEK, apiKey: env.OPENROUTER_API_KEY_DEEPSEEK || env.OPENROUTER_API_KEY, hint: "deepseek" });
  }
  if (env.OPENROUTER_KEY_GOOGLE && (env.OPENROUTER_API_KEY_GOOGLE || env.OPENROUTER_API_KEY)) {
    plan.push({ model: env.OPENROUTER_KEY_GOOGLE, apiKey: env.OPENROUTER_API_KEY_GOOGLE || env.OPENROUTER_API_KEY, hint: "google" });
  }
  if (env.OPENROUTER_GROK && (env.OPENROUTER_API_KEY_GROK || env.OPENROUTER_API_KEY)) {
    plan.push({ model: env.OPENROUTER_GROK, apiKey: env.OPENROUTER_API_KEY_GROK || env.OPENROUTER_API_KEY, hint: "grok" });
  }
  if (env.OPENROUTER_KEY_META && (env.OPENROUTER_API_KEY_META || env.OPENROUTER_API_KEY)) {
    plan.push({ model: env.OPENROUTER_KEY_META, apiKey: env.OPENROUTER_API_KEY_META || env.OPENROUTER_API_KEY, hint: "meta" });
  }
  if (env.OPENROUTER_DEFAULT_MODEL && env.OPENROUTER_API_KEY) {
    plan.push({ model: env.OPENROUTER_DEFAULT_MODEL, apiKey: env.OPENROUTER_API_KEY, hint: "default" });
  }
  return plan;
}

async function callOnce({ model, apiKey }, prompt, system = "You are a helpful rewriting assistant.") {
  const body = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 500
  };

  const resp = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.OPENROUTER_REFERRER || "https://example.com",
      "X-Title": process.env.OPENROUTER_TITLE || "AI Podcast Suite"
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} ${resp.statusText} – ${text[:200]}`);
  }

  const data = await resp.json();
  const out = data?.choices?.[0]?.message?.content;
  if (!out || typeof out !== "string") {
    throw new Error("Empty/invalid OpenRouter response");
  }
  return out.trim();
}

export async function callOpenRouterModel(prompt, system) {
  const plan = getModelPlan();
  if (!plan.length) {
    throw new Error("No OpenRouter models configured in environment");
  }

  for (const step of plan) {
    try {
      info("ai.call", { model: step.model });
      const out = await callOnce(step, prompt, system);
      return out;
    } catch (err) {
      error("ai.fail", { model: step.model, error: err.message });
    }
  }
  throw new Error("All OpenRouter model calls failed");
}