import { checkEnv } from "./utils/env-checker.js";

// Required envs for Podcast-artwork
checkEnv([
  "OPENROUTER_API_KEY_ART",
  "R2_ACCOUNT_ID",
  "R2_BUCKET_ART",
  "R2_PUBLIC_BASE_URL_ART",
  "PORT",
  "NODE_ENV",
  "LOG_LEVEL"
]);

console.log("🚀 Podcast-artwork service running...");
