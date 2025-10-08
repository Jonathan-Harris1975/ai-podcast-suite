  // utils/r2-client.js
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";
import { log } from "./logger.js";

// ──────────────────────────────────────────────
// Environment config
// ──────────────────────────────────────────────
const ENDPOINT = process.env.R2_ENDPOINT;
const REGION = process.env.R2_REGION || "auto";
const ACCESS_KEY =
  process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY || "";
const SECRET_KEY =
  process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY || "";
const BUCKET = process.env.R2_BUCKET_RSS || "rss-feeds";

// ──────────────────────────────────────────────
// Client initialization
// ──────────────────────────────────────────────
export const r2 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

// ──────────────────────────────────────────────
// Connection verification
// ──────────────────────────────────────────────
(async () => {
  try {
    if (!ENDPOINT) throw new Error("R2_ENDPOINT is missing.");
    if (!ACCESS_KEY || !SECRET_KEY)
      throw new Error("Missing R2 access credentials.");

    // Attempt to list buckets to confirm connectivity
    const result = await r2.send(new ListBucketsCommand({}));
    const bucketNames = result.Buckets?.map(b => b.Name).join(", ") || "none";
    log.info(
      `✅ Connected to R2 endpoint: ${ENDPOINT} | Region: ${REGION} | Buckets: ${bucketNames}`
    );
  } catch (err) {
    log.error(
      `❌ R2 connection check failed: ${err.message}\nMake sure ENDPOINT and credentials are valid.`
    );
  }
})();

// ──────────────────────────────────────────────
// Core R2 functions
// ──────────────────────────────────────────────
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

export async function putText(key, text) {
  let contentType = "text/plain; charset=utf-8";
  if (key.endsWith(".xml"))
    contentType = "application/rss+xml; charset=utf-8";
  else if (key.endsWith(".html") || key.endsWith(".htm"))
    contentType = "text/html; charset=utf-8";

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

export async function headObject(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404)
      return false;
    throw err;
  }
}

export async function getObject(key) {
  try {
    const data = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!data.Body) return null;
    return await data.Body.transformToString("utf-8");
  } catch (err) {
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      log.warn(`⚠️ R2 object not found: ${key}`);
      return null;
    }
    log.error(`❌ Failed to fetch R2 object (${key}): ${err.message}`);
    throw err;
  }
}
