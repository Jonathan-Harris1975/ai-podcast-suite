// utils/r2-client.js
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { log } from "../../../utils/logger.js";

const endpoint = process.env.R2_ENDPOINT;
const region = process.env.R2_REGION || "auto";
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_RSS_FEEDS || "rss-feeds";

if (!endpoint) throw new Error("❌ Missing R2_ENDPOINT in environment");
if (!accessKeyId || !secretAccessKey)
  throw new Error("❌ Missing R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY");

export const r2Client = new S3Client({
  region,
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

log.info(`☁️ Connected to Cloudflare R2 bucket: ${bucket}`);

// Convert R2 stream to string
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

// ---------------- Core Operations ----------------

// ✅ Read object as text
export async function getObject(key) {
  try {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const data = await r2Client.send(cmd);
    return await streamToString(data.Body);
  } catch (err) {
    throw new Error(`GET ${key} failed: ${err.message}`);
  }
}

// ✅ Upload text / string data
export async function putText(key, content) {
  try {
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: "text/plain; charset=utf-8",
    });
    await r2Client.send(cmd);
    log.info(`✅ PUT ${key} → ${bucket}`);
  } catch (err) {
    throw new Error(`PUT ${key} failed: ${err.message}`);
  }
}

// ✅ List objects (optional)
export async function listObjects(prefix = "") {
  try {
    const cmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix });
    const res = await r2Client.send(cmd);
    return res.Contents?.map((o) => o.Key) || [];
  } catch (err) {
    throw new Error(`LIST failed: ${err.message}`);
  }
}

// ✅ Verify bucket accessibility
export async function verifyBucket() {
  const cmd = new HeadBucketCommand({ Bucket: bucket });
  await r2Client.send(cmd);
  log.info(`📦 Verified R2 bucket exists: ${bucket}`);
  return true;
}

// ✅ Optional: generate temporary signed URL
export async function getSignedUrlForKey(key, expiresIn = 3600) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(r2Client, cmd, { expiresIn });
    }
