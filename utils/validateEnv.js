// Minimal env validator — single concise line, no R2 ping
export function validateEnv() {
  const required = [
    "R2_ENDPOINT","R2_REGION","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_RSS_FEEDS","R2_BUCKET_RAW_TEXT","R2_BUCKET_RAW",
    "R2_BUCKET_MERGED","R2_BUCKET_PODCAST","R2_BUCKET_META"
  ];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error("❌ Missing env:", missing.join(", "));
    process.exit(1);
  }
  console.log("✅ R2 configuration OK");
}
