// Unified Bootstrap (no auto-start services) – v2025.10.10
// Validates env presence and R2 variables without pinging any endpoints.
import process from "node:process";

const log = (emoji, message, meta = null) => {
  const entry = { emoji, time: new Date().toISOString(), message };
  if (meta && Object.keys(meta).length) entry.meta = meta;
  process.stdout.write(JSON.stringify(entry) + "\n");
};

function requireEnv(name, allowEmpty=false) {
  const val = process.env[name];
  if (!allowEmpty && (!val || String(val).trim()==="")) {
    log("⚠️", `Missing env ${name}`);
    return false;
  }
  return true;
}

(function init() {
  log("🧰", "Bootstrap starting");
  const required = [
    "R2_ENDPOINT",
    "R2_REGION",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    // buckets (presence optional but recommended)
    "R2_BUCKET_RSS_FEEDS",
    "R2_BUCKET_ARTWORK",
    "R2_BUCKET_META",
  ];
  let ok = true;
  for (const key of required) ok = requireEnv(key, key.startsWith("R2_BUCKET_")) && ok;

  if (ok) {
    log("✅", "Env check passed");
    log("✅", "R2 configuration OK (presence only, no network ping)");
  } else {
    log("⚠️", "Env check incomplete; proceed with caution");
  }
})();
