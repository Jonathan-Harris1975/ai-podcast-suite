/**
 * Cloudflare  with Deep Bucket Diagnostics
 * -------------------------------------------------
 * Validates credentials, endpoint, and bucket access on startup.
 */

import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

// ────────────────────────────────────────────────────────────────
// Load env vars
// ────────────────────────────────────────────────────────────────
const {
  R2_ENDPOINT,
  R2_REGION,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_RSS_FEEDS,
  R2_BUCKET_RAW_TEXT,
  R2_BUCKET_PODCAST,
  R2_BUCKET_META,
  R2_BUCKET_RAW,
  R2_BUCKET_MERGED,
} = process.env;

// Build list of buckets to check
const buckets = [
  R2_BUCKET_RSS_FEEDS,
  R2_BUCKET_RAW_TEXT,
  R2_BUCKET_PODCAST,
  R2_BUCKET_META,
  R2_BUCKET_RAW,
  R2_BUCKET_MERGED,
].filter(Boolean);

// ────────────────────────────────────────────────────────────────
// Log configuration (with masking)
// ────────────────────────────────────────────────────────────────
console.log("🧠 R2 Diagnostic Check:");
console.log("🔹 Endpoint:", R2_ENDPOINT || "(not set)");
console.log("🔹 Region:", R2_REGION || "(not set)");
console.log(
  "🔹 Access Key ID:",
  R2_ACCESS_KEY_ID ? R2_ACCESS_KEY_ID.slice(0, 4) + "..." : "(missing)"
);
console.log("🔹 Secret Key:", R2_SECRET_ACCESS_KEY ? "●●●●●" : "(missing)");
console.log("🔹 Buckets to check:", buckets.join(", ") || "(none)");

// ────────────────────────────────────────────────────────────────
// Create the R2 (S3-compatible) client
// ────────────────────────────────────────────────────────────────
export const r2Client = new S3Client({
  region: R2_REGION || "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ────────────────────────────────────────────────────────────────
// Connectivity + per-bucket validation
// ────────────────────────────────────────────────────────────────
(async () => {
  console.log("🌐 Running R2 connectivity and bucket checks...");

  for (const bucket of buckets) {
    try {
      await r2Client.send(new HeadBucketCommand({ Bucket: bucket }));
      console.log(`✅ Bucket "${bucket}" is reachable.`);
    } catch (err) {
      console.error(`❌ Bucket "${bucket}" failed:`);
      console.error("   Error name:", err.name);
      console.error("   Message:", err.message);
      console.error("   HTTP Code:", err.$metadata?.httpStatusCode);
      if (err.Code) console.error("   Code:", err.Code);
      if (err.Region) console.error("   Region hint:", err.Region);
    }
  }

  console.log("🧩 R2 diagnostic check complete.");
})();
