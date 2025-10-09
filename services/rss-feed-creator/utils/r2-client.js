// utils/r2-client.js
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { log } from "./logger.js";

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_KEY || process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_RSS || "rss-feeds";

/**
 * Upload JSON file to R2
 */
export async function putJson(key, data) {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json; charset=utf-8",
    })
  );
  log.info({ key }, "📦 JSON uploaded to R2");
}

/**
 * Upload text or XML file to R2
 * - Detects XML and sets correct MIME type
 */
export async function putText(key, text) {
  let contentType = "text/plain; charset=utf-8";
  if (key.endsWith(".xml")) {
    contentType = "application/rss+xml; charset=utf-8";
  } else if (key.endsWith(".html") || key.endsWith(".htm")) {
    contentType = "text/html; charset=utf-8";
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(text, "utf-8"),
      ContentType: contentType,
    })
  );
  log.info({ key, contentType }, "📦 Text uploaded to R2");
}

/**
 * Check if object exists
 */
export async function headObject(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

/**
 * Fetch an object from R2
 */
export async function getObject(key) {
  try {
    const data = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!data.Body) return null;
    return await data.Body.transformToString("utf-8");
  } catch (err) {
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}  if (key.endsWith(".xml")) {
    contentType = "application/rss+xml; charset=utf-8";
  } else if (key.endsWith(".html") || key.endsWith(".htm")) {
    contentType = "text/html; charset=utf-8";
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(text, "utf-8"),
      ContentType: contentType,
    })
  );
  log.info({ key, contentType }, "📦 Text uploaded to R2");
}

/**
 * Check if object exists
 */
export async function headObject(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

/**
 * Fetch an object from R2
 */
export async function getObject(key) {
  try {
    const data = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!data.Body) return null;
    return await data.Body.transformToString("utf-8");
  } catch (err) {
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}// Create the S3-compatible R2 client
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
