/**
 * Root Environment Validator (Hard Stop)
 * Only used at root server start.
 */
export function validateEnv() {
  console.log("🔍 Validating environment variables...");
  const required = [
    "R2_ENDPOINT","R2_REGION","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_RSS_FEEDS","R2_BUCKET_RAW_TEXT","R2_BUCKET_PODCAST",
    "R2_BUCKET_META","R2_BUCKET_RAW","R2_BUCKET_MERGED","OPENROUTER_API_KEY"
  ];
  let missing = false;
  for (const key of required) {
    if (!process.env[key]) { console.error(`❌ Missing ${key}`); missing = true; }
    else { console.log(`✅ ${key} = [OK]`); }
  }
  if (missing) { console.error("🚨 Missing critical environment variables. Exiting."); process.exit(1); }
  console.log("✅ Environment validation passed");
}
