/**
 * Cloudflare R2 Client (Unified)
 * -----------------------------------------------
 * Used across all services in the AI Podcast & Newsletter Suite.
 * - Handles connectivity to Cloudflare R2 via AWS SDK v3 (S3Client).
 * - Performs a one-time bucket validation on startup.
 * - No ping, no retry loops — clean for Shiper deployment.
 */

import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

const {
  R2_ENDPOINT,
  R2_REGION,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_RSS_FEEDS
} = process.env;

// ────────────────────────────────────────────────
// Sanity check: ensure all core env vars exist
// ────────────────────────────────────────────────
const required = [
  "R2_ENDPOINT",
  "R2_REGION",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_RSS_FEEDS"
];
const missing = required.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error("🚨 Missing R2 environment variables:", missing.join(", "));
  throw new Error("R2 configuration incomplete.");
}

// ────────────────────────────────────────────────
// Create the S3-compatible R2 client
// ────────────────────────────────────────────────
export const r2Client = new S3Client({
  region: R2_REGION || "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  }
});

// ────────────────────────────────────────────────
// Validate connectivity by checking one real bucket
// ────────────────────────────────────────────────
export const validateR2 = async () => {
  console.log("🌐 Checking Cloudflare R2 connectivity...");
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
};

// Automatically run the validation once at import
validateR2().catch((err) => {
  console.error("❌ R2 validation error:", err.message);
});

export default r2Client;
