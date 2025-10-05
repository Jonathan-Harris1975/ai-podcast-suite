import { log as logger } from "./logger.js";

function bool(v, d=false) {
  if (v === undefined) return d;
  return String(v).toLowerCase() === "true";
}

const env = {
  PORT: process.env.PORT || "3000",
  NODE_ENV: process.env.NODE_ENV || "production",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  APP_TITLE: process.env.APP_TITLE || "AI Podcast Suite",
  APP_DESC: process.env.APP_DESC || "End-to-end orchestrator for podcast pipeline",

  WEBHOOKS_ENABLED: bool(process.env.WEBHOOKS_ENABLED, false),

  DOWNSTREAM_WEBHOOKS_ENABLED: bool(process.env.DOWNSTREAM_WEBHOOKS_ENABLED, false),

  SCRIPT_START_URL: process.env.SCRIPT_START_URL || "",
  ARTWORK_START_URL: process.env.ARTWORK_START_URL || "",
  TTS_START_URL: process.env.TTS_START_URL || "",

  FEED_URL: process.env.FEED_URL || "https://ai-news.jonathan-harris.online/rss.xml",
  RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || "",
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || "",

  R2_PUBLIC_BASE_URL_RAW_TEXT: process.env.R2_PUBLIC_BASE_URL_RAW_TEXT || "",
  R2_PUBLIC_BASE_URL_META: process.env.R2_PUBLIC_BASE_URL_META || "",
};

const warnKeys = ["SCRIPT_START_URL","ARTWORK_START_URL","TTS_START_URL"];
for (const k of warnKeys) if (!env[k]) logger.warn({ key: k }, "⚠️ Missing env (set this for real calls)");

export { env };
