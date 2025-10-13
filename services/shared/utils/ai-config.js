export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
export const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

const DEFAULT_MODELS = [
    "openai/gpt-4o-mini",
  "anthropic/claude-4.5-sonnet",
    "deepseek/deepseek-chat"
  "google/gemini-2.0-flash-001",
  "meta-llama/llama-4-scout"
];

export const MODEL_ORDER = (process.env.OPENROUTER_MODELS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

export const MODELS = MODEL_ORDER.length ? MODEL_ORDER : DEFAULT_MODELS;

export const OPENROUTER_HEADERS = {
  "Authorization": OPENROUTER_API_KEY ? `Bearer ${OPENROUTER_API_KEY}` : "",
  "Content-Type": "application/json",
  "HTTP-Referer": process.env.SITE_URL || "https://ai-podcast-suite",
  "X-Title": process.env.SITE_TITLE || "AI Podcast Suite",
};
