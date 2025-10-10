// Centralized Cloudflare R2 client (ESM, lenient validator)
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

let _validated = false;
/** One-time lenient R2 check; logs, never throws. */
export async function validateR2ConfigOnce() {
  if (_validated) return true;
  _validated = true;

  const req = ["R2_ENDPOINT","R2_REGION","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY"];
  const missing = req.filter(k => !process.env[k]);
  if (missing.length) {
    console.warn(`⚠️ R2 configuration missing: ${missing.join(", ")}`);
    return false;
  }

  const buckets = [
    process.env.R2_BUCKET_RSS_FEEDS,
    process.env.R2_BUCKET_ARTWORK,
    process.env.R2_BUCKET_META,
    process.env.R2_BUCKET_PODCAST,
    process.env.R2_BUCKET_RAW_TEXT
  ].filter(Boolean);

  if (!buckets.length) {
    console.log("ℹ️ R2 validation: no buckets set; skipping HeadBucket check.");
    return true;
  }

  const bucket = buckets[0];
  try {
    await r2.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log("✅ R2 configuration OK");
  } catch (e) {
    const code = (e && e.$metadata && e.$metadata.httpStatusCode) || e?.name || "UnknownError";
    console.warn(`⚠️ R2 HeadBucket '${bucket}' failed: ${code}. Startup continues.`);
  }
  return true;
}
