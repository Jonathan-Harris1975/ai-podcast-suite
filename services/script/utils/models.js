// services/script/utils/models.js
import { info } from "#shared/logger.js";
// We only depend on the *route* interface from the shared service:
import {
  getModelForRoute,
  callOpenRouter,   // generic caller the shared service exposes
} from "#shared/ai-service.js";

// Helper: robust call with route look-up + minimal retries (local)
async function callRoute(route, { system, prompt, maxTokens = 800, temperature = 0.3 }) {
  const model = getModelForRoute(route);
  info("script.ai.call", { route, model });

  // NOTE: callOpenRouter(system, prompt, { model, ...opts }) signature assumed
  // If your shared service’s signature differs, this is the only place to tweak.
  return callOpenRouter({
    model,
    system,
    prompt,
    options: { maxTokens, temperature },
  });
}

export async function rewriteOutline({ system, prompt }) {
  const out = await callRoute("script.outline", { system, prompt, maxTokens: 1200, temperature: 0.2 });
  // Expect JSON or plain text; we normalize to { sections: string[] } if possible
  try {
    const j = typeof out === "string" ? JSON.parse(out) : out;
    if (Array.isArray(j?.sections)) return { sections: j.sections };
  } catch {}
  return { text: String(out || "").trim() };
}

export async function expandSection({ system, prompt }) {
  const out = await callRoute("script.expand", { system, prompt, maxTokens: 1400, temperature: 0.5 });
  return typeof out === "string" ? { text: out } : out;
}

export async function tightenRead({ system, prompt }) {
  const out = await callRoute("script.tighten", { system, prompt, maxTokens: 1000, temperature: 0.2 });
  return typeof out === "string" ? { text: out } : out;
}
