// ANSI color helper (replaces )
\x1b[0m`,
  red:   (msg) => `\x1b[31m${msg}\x1b[0m`,
  yellow:(msg) => `\x1b[33m${msg}\x1b[0m`,
  blue:  (msg) => `\x1b[34m${msg}\x1b[0m`,
  cyan:  (msg) => `\x1b[36m${msg}\x1b[0m`,
  magenta:(msg)=> `\x1b[35m${msg}\x1b[0m`,
  gray:  (msg) => `\x1b[90m${msg}\x1b[0m`
};

// utils/validateEnv.js
import process from "process";

let ;

// ✅ Graceful dynamic import with fallback (for Shiper, Docker, etc.)
try {
  const Module = await import("");
   = Module.default;
} catch {
  // Minimal fallback if  is missing
   = {
    cyanBright: (s) => s,
    red: (s) => s,
    redBright: (s) => s,
    green: (s) => s,
    greenBright: (s) => s,
    magentaBright: (s) => s,
    cyan: (s) => s,
  };
  console.warn(
    "⚠️  '' not found. Run `npm install ` for colored output."
  );
}

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

  console.log(("🧩 Validating environment variables..."));
  const missing = [];
  const r2Buckets = [];

  for (const key of required) {
    const val = process.env[key];
    if (!val || !val.trim()) {
      console.log((`❌ Missing: ${key}`));
      missing.push(key);
    } else {
      console.log(
        (
          `✅ ${key} = ${val.startsWith("https") ? val : "[OK]"}`
        )
      );
      if (key.startsWith("R2_BUCKET_")) r2Buckets.push(val);
    }
  }

  if (missing.length) {
    console.error(
      (
        `\n🚨 Missing ${missing.length} critical environment variable(s): ${missing.join(", ")}`
      )
    );
    process.exit(1);
  }

  console.log(("\n✅ Environment validation passed\n"));

  // Display R2 summary
  console.log(("🌐 Cloudflare R2 Configuration"));
  console.log(("───────────────────────────────"));

  for (const bucket of r2Buckets) {
    console.log((`📦 ${bucket}`));
  }

  console.log(("\n✅ Environment validation complete\n"));
}
