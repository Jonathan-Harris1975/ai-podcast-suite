/**
 * Cloudflare R2 Client
 * --------------------
 * Uses the AWS SDK v3 S3Client for R2 connectivity.
 * Validates one real bucket instead of "pinging" the endpoint.
 */
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

const {
  R2_ENDPOINT,
  R2_REGION,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_RSS_FEEDS,
} = process.env;

export const r2Client = new S3Client({
  region: R2_REGION || "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// One-time validation (non-blocking for imports elsewhere)
(async () => {
  try {
    console.log("🌐 Validating Cloudflare R2 connectivity...");
    await r2Client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_RSS_FEEDS }));
    console.log(`✅ Successfully connected to R2 bucket "${R2_BUCKET_RSS_FEEDS}".`);
  } catch (err) {
    console.error("🚨 R2 connectivity check failed:");
    console.error("   Error:", err.name);
    console.error("   Message:", err.message);
    console.error("   HTTP:", err.$metadata?.httpStatusCode);
  } finally {
    console.log("🧩 R2 validation complete.");
  }
})();
