// services/env-checker.js (ESM)
export function validateEnv() {
  const required = [
    "R2_ENDPOINT","R2_REGION","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_RSS_FEEDS","R2_BUCKET_RAW_TEXT","R2_BUCKET_PODCAST",
    "R2_BUCKET_META","R2_BUCKET_RAW","R2_BUCKET_MERGED","OPENROUTER_API_KEY"
  ];
  for (const key of required) {
    if (!process.env[key]) {
      process.exit(1);
    }
  }
}
