// services/utils/r2-validate.js
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

const {
  R2_ENDPOINT,
  R2_REGION,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_RSS_FEEDS,
} = process.env;

export async function validateR2Once() {
  console.log("🌐 Validating Cloudflare R2 connectivity...");
  const s3 = new S3Client({
    region: R2_REGION || "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  try {
    await s3.send(new HeadBucketCommand({ Bucket: R2_BUCKET_RSS_FEEDS }));
    console.log(`✅ Successfully connected to R2 bucket "${R2_BUCKET_RSS_FEEDS}".`);
  } catch (err) {
    console.error("🚨 R2 connectivity check failed:");
    console.error("   Error:", err.name);
    console.error("   Message:", err.message);
    if (err.$metadata?.httpStatusCode) console.error("   HTTP:", err.$metadata.httpStatusCode);
    throw err;
  }
  console.log("🧩 R2 validation complete.");
}
