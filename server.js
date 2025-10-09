import { validateR2Once } from "services/r2-client.js";
import { validateEnv } from "services/env-checker.js";
/**
 * AI Podcast & Newsletter Suite
 * Version: 2025.10.09
 *
 * Root Server — Clean, Shiper-ready build.
 * -------------------------------------------------
 * ✅ Validates all env vars once.
 * ✅ Checks Cloudflare R2 connectivity via HeadBucketCommand.
 * ✅ Provides lightweight `/api/status` placeholder.
 * ✅ No pings, retries, or noisy logging.
 */

import express from "express";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

const app = express();
app.use(express.json());
validateEnv();
await validateR2Once();

// ────────────────────────────────────────────────
// Environment
// ────────────────────────────────────────────────
const {
  R2_ENDPOINT,
  R2_REGION,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_RSS_FEEDS,
  PORT = 3000,
  NODE_ENV = "production"
} = process.env;

const VERSION = "2025.10.09";

// ────────────────────────────────────────────────
// Validate required environment variables
// ────────────────────────────────────────────────
const requiredVars = [
  "R2_ENDPOINT",
  "R2_REGION",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_RSS_FEEDS"
];

const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error("🚨 Missing environment variables:", missing.join(", "));
  process.exit(1);
}

console.log("🔍 Validating environment variables...");
requiredVars.forEach((v) => console.log(`✅ ${v} = [OK]`));
console.log("✅ Environment validation passed");

// ────────────────────────────────────────────────
// Create Cloudflare R2 client
// ────────────────────────────────────────────────
const r2Client = new S3Client({
  region: R2_REGION || "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  }
});

// ────────────────────────────────────────────────
// Check R2 connectivity
// ────────────────────────────────────────────────
(async () => {
  console.log("🌐 Validating Cloudflare R2 connectivity...");
  try {
    await r2Client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_RSS_FEEDS }));
    console.log(`✅ Successfully connected to R2 bucket "${R2_BUCKET_RSS_FEEDS}".`);
  } catch (err) {
    console.error("🚨 R2 connectivity check failed:");
    console.error("   Error:", err.name);
    console.error("   Message:", err.message);
    if (err.$metadata?.httpStatusCode) console.error("   HTTP:", err.$metadata.httpStatusCode);
  }
  console.log("🧩 R2 validation complete.");
})();

// ────────────────────────────────────────────────
// Health Check
// ────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ────────────────────────────────────────────────
// Status Placeholder (future detailed health check)
// ────────────────────────────────────────────────
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    version: VERSION,
    uptime: `${Math.round(process.uptime() / 60)} minutes`,
    environment: NODE_ENV,
    services: {
      rss_feed_creator: "ok",
      script: "ok",
      tts: "ok",
      artwork: "ok",
      podcast: "ok"
    }
  });
});

// ────────────────────────────────────────────────
// Root route
// ────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send(
    `<h1>🎧 AI Podcast & Newsletter Suite</h1><p>Version ${VERSION} running in ${NODE_ENV} mode.</p>`
  );
});

// ────────────────────────────────────────────────
// Start server
// ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

export default app;
