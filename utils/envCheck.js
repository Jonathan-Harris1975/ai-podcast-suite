import { log } from "logger.js";

const REQUIRED_GLOBAL = ["LOG_LEVEL","NODE_ENV","PORT","WEBHOOKS_ENABLED"];

const REQUIRED_SCRIPT = [
  "FEED_URL",
  "OPENROUTER_API_KEY_CHATGPT",
  "OPENROUTER_API_KEY_DEEPSEEK",
  "OPENROUTER_API_KEY_GOOGLE",
  "OPENROUTER_API_KEY_GROK",
  "OPENROUTER_API_KEY_META",
  "R2_BUCKET_CHUNKS",
  "R2_BUCKET_TRANSCRIPTS",
  "R2_META_BUCKET",
  "R2_PUBLIC_BASE_URL_CHUNKS",
  "R2_PUBLIC_BASE_URL_META",
  "R2_PUBLIC_BASE_URL_TRANSCRIPT",
  "RAPIDAPI_HOST",
  "RAPIDAPI_KEY"
];

const REQUIRED_ART = [
  "OPENROUTER_API_KEY_ART",
  "R2_BUCKET_ART",
  "R2_PUBLIC_BASE_URL_ART"
];

const REQUIRED_TTS = [
  "GCP_PROJECT_ID",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "PODCAST_INTRO_URL",
  "PODCAST_OUTRO_URL",
  "R2_BUCKET_PODCAST",
  "R2_BUCKET_RAW",
  "R2_BUCKET_RAW_TEXT",
  "R2_META_BUCKET",
  "R2_PUBLIC_BASE_URL_MERGE",
  "R2_PUBLIC_BASE_URL_META",
  "R2_PUBLIC_BASE_URL_PODCAST",
  "R2_PUBLIC_BASE_URL_RAW",
  "R2_PUBLIC_BASE_URL_RAW_TEXT",
  "PROCESSING_TIMEOUT_MS",
  "MIN_INTRO_DURATION",
  "MIN_OUTRO_DURATION"
];

export function checkEnvFatal() {
  const missing = [];
  const collect = (keys) => keys.forEach(k => { if (!process.env[k]) missing.push(k); });
  collect(REQUIRED_GLOBAL);
  collect(REQUIRED_SCRIPT);
  collect(REQUIRED_ART);
  collect(REQUIRED_TTS);

  if (missing.length) {
    log.error({ missing }, "❌ Missing required environment variables");
    process.exit(1);
  }
  log.info("✅ Environment variables OK");
}
