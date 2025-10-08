// utils/r2-client.js
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { log } from "../../../utils/logger.js";
import { Readable } from "stream";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.R2_ENDPOINT;
const region   = process.env.R2_REGION || "auto";
const accessKey = process.env.R2_ACCESS_KEY_ID;
const secretKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket    = process.env.R2_BUCKET_RSS_FEEDS || "rss-feeds";

if (!endpoint) throw new Error("❌ Missing R2_ENDPOINT in environment");
if (!accessKey || !secretKey) throw new Error("❌ Missing R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY in environment");

export const r2Client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
});

log.info(`☁️ Connected to R2 bucket: ${bucket} (${endpoint})`);

function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

// ✅ Download an object as text
export async function getObject(key) {
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const data = await r2Client.send(command);
    return await streamToString(data.Body);
  } catch (err) {
    throw new Error(`GET ${key} failed: ${err.message}`);
  }
}

// ✅ Upload text or JSON
export async function putText(key, content) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: "text/plain; charset=utf-8",
    });
    await r2Client.send(command);
    log.info(`✅ PUT ${key} → ${bucket}`);
  } catch (err) {
    throw new Error(`PUT ${key} failed: ${err.message}`);
  }
}

// ✅ Optional: list objects in the bucket
export async function listObjects(prefix = "") {
  const command = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix });
  const data = await r2Client.send(command);
  return data.Contents?.map((o) => o.Key) || [];
}

// ✅ Optional: generate a temporary signed URL (for public read access)
export async function getSignedUrlForKey(key, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(r2Client, command, { expiresIn });
    }
