import { logger } from "./logger.js";

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
  WEBHOOK_SIGNATURE_MODE: process.env.WEBHOOK_SIGNATURE_MODE || "none",
  HOOKDECK_WEBHOOK_SECRET: process.env.HOOKDECK_WEBHOOK_SECRET || "",

  DOWNSTREAM_WEBHOOKS_ENABLED: bool(process.env.DOWNSTREAM_WEBHOOKS_ENABLED, false),
  DOWNSTREAM_WEBHOOK_SIGNATURE_MODE: process.env.DOWNSTREAM_WEBHOOK_SIGNATURE_MODE || "none",
  DOWNSTREAM_WEBHOOK_SECRET: process.env.DOWNSTREAM_WEBHOOK_SECRET || "",

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
