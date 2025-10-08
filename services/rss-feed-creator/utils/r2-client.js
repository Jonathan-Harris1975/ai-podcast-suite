import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { log } from "../../../utils/logger.js";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

export async function getObject(key) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const data = await r2Client.send(cmd);
  return await streamToString(data.Body);
}

export async function putText(key, content) {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: content,
    ContentType: "text/plain; charset=utf-8",
  });
  await r2Client.send(cmd);
  log.info(`✅ PUT ${key} → ${bucket}`);
}

export async function listObjects(prefix = "") {
  const cmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix });
  const res = await r2Client.send(cmd);
  return res.Contents?.map((o) => o.Key) || [];
}

export async function verifyBucket() {
  const cmd = new HeadBucketCommand({ Bucket: bucket });
  await r2Client.send(cmd);
  log.info(`📦 Verified R2 bucket exists: ${bucket}`);
  return true;
}

/**
 * 100 % safe presigner loader — never statically references AWS package.
 */
export async function getSignedUrlForKey(key, expiresIn = 3600) {
  const presignerFile = pathToFileURL(
    path.join(__dirname, "presigner-loader.js")
  ).href;

  try {
    const loader = await import(presignerFile);
    return await loader.getSignedUrl(r2Client, bucket, key, expiresIn);
  } catch (err) {
    log.warn(`⚙️ Presigner loader not found or failed: ${err.message}`);
    return null;
  }
}
