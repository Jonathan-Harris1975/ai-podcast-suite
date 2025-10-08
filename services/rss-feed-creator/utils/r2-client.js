// utils/r2-client.js
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { log } from "../../../utils/logger.js";

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
}
