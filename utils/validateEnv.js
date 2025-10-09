// ANSI color helper (replaces chalk)
const colors = {
  reset: (msg) => `${msg}\x1b[0m`,
  red:   (msg) => `\x1b[31m${msg}\x1b[0m`,
  yellow:(msg) => `\x1b[33m${msg}\x1b[0m`,
  blue:  (msg) => `\x1b[34m${msg}\x1b[0m`,
  cyan:  (msg) => `\x1b[36m${msg}\x1b[0m`,
  magenta:(msg)=> `\x1b[35m${msg}\x1b[0m`,
  gray:  (msg) => `\x1b[90m${msg}\x1b[0m`,
  green: (msg) => `\x1b[32m${msg}\x1b[0m`,
  cyanBright: (msg) => `\x1b[96m${msg}\x1b[0m`,
  redBright: (msg) => `\x1b[91m${msg}\x1b[0m`,
  greenBright: (msg) => `\x1b[92m${msg}\x1b[0m`,
  magentaBright: (msg) => `\x1b[95m${msg}\x1b[0m`
};

// utils/validateEnv.js
import process from "process";

/**
 * Validate required environment variables and summarize R2 configuration.
 */
export function validateEnv() {
  const required = [
    "R2_ENDPOINT",
    "R2_REGION",
    "R2_BUCKET_RSS_FEEDS",
    "R2_BUCKET_RAW_TEXT",
    "R2_BUCKET_PODCAST",
    "R2_BUCKET_META",
    "R2_BUCKET_RAW",
    "R2_BUCKET_MERGED",
    "OPENROUTER_API_KEY",
    "LOG_LEVEL",
    "NODE_ENV",
    "PORT",
  ];

  console.log(colors.blue("🧩 Validating environment variables..."));
  
  const missing = [];
  const r2Buckets = [];
  
  for (const key of required) {
    const val = process.env[key];
    if (!val || !val.trim()) {
      console.log(colors.red(`❌ Missing: ${key}`));
      missing.push(key);
    } else {
      console.log(
        colors.green(
          `✅ ${key} = ${val.startsWith("https") ? val : "[OK]"}`
        )
      );
      if (key.startsWith("R2_BUCKET_")) r2Buckets.push(val);
    }
  }

  if (missing.length) {
    console.error(
      colors.redBright(
        `\n🚨 Missing ${missing.length} critical environment variable(s): ${missing.join(", ")}`
      )
    );
    process.exit(1);
  }

  console.log(colors.green("\n✅ Environment validation passed\n"));

  // Display R2 summary
  console.log(colors.cyanBright("🌐 "));
  console.log(colors.gray(""));
  for (const bucket of r2Buckets) {
    console.log(colors.cyan(`📦 ${bucket}`));
  }
  console.log(colors.green("\n✅ Environment validation complete\n"));
}
