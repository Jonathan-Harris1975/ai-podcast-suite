import { checkEnv } from "./utils/env-checker.js";

// Required envs for Script-maker
checkEnv([
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
  "RAPIDAPI_KEY",
  "PORT",
  "NODE_ENV",
  "LOG_LEVEL"
]);

console.log("🚀 Script-maker service running...");
