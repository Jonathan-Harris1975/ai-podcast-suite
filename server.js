/**
 * AI Podcast Suite - Server Entry
 * --------------------------------
 * Express server with environment validation, R2 connectivity checks,
 * and /health endpoint for Shiper.
 */

import express from "express";
import dotenv from "dotenv";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ────────────────────────────────────────────────
// Environment Variables Validation
// ────────────────────────────────────────────────
async function validateEnvironment() {
  console.log("🔍 Validating environment variables...");

  const required = [
    "R2_ENDPOINT",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_RSS_FEEDS",
    "R2_BUCKET_RAW_TEXT",
    "R2_BUCKET_PODCAST",
    "R2_BUCKET_META",
    "R2_BUCKET_RAW",
    "R2_BUCKET_MERGED",
    "OPENROUTER_API_KEY",
  ];

  const missing = [];
  for (const key of required) {
    if (!process.env[key]) missing.push(key);
    else console.log(`✅ ${key} = [OK]`);
  }

  if (missing.length > 0) {
    console.error("🚨 Missing environment variables:", missing.join(", "));
    throw new Error("Environment validation failed");
  }

  console.log("✅ Environment validation passed");
}

// ────────────────────────────────────────────────
/** R2 Connectivity Check (HeadBucket) */
// ────────────────────────────────────────────────
async function verifyR2Connectivity() {
  console.log("🌐 Checking Cloudflare R2 connectivity...");

  const {
    R2_ENDPOINT,
    R2_REGION,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_RSS_FEEDS,
  } = process.env;

  const s3 = new S3Client({
    region: R2_REGION || "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  try {
    await s3.send(new HeadBucketCommand({
      Bucket: R2_BUCKET_RSS_FEEDS || "rss-feeds",
    }));
    console.log(`✅ Successfully connected to R2 bucket "${R2_BUCKET_RSS_FEEDS}".`);
  } catch (err) {
    console.error("🚨 R2 connectivity check failed:");
    console.error("   Error:", err.name);
    console.error("   Message:", err.message);
    console.error("   HTTP:", err.$metadata?.httpStatusCode);
    throw new Error(`Unable to connect to R2: ${err.message}`);
  }

  console.log("🧩 R2 validation complete.");
}

// ────────────────────────────────────────────────
// Health Route (for Shiper)
// ────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Optional root
app.get("/", (req, res) => {
  res.send("🚀 AI Podcast Suite Server is running");
});

// ────────────────────────────────────────────────
// Startup
// ────────────────────────────────────────────────
async function startServer() {
  try {
    await validateEnvironment();
    await verifyR2Connectivity();
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Startup failed:", err.message);
    process.exit(1);
  }
}
startServer();
