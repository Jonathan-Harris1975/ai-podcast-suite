// services/shared/utils/r2-client.js
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { info, warn, error } from "./logger.js";

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

let s3 = null;
if (endpoint && accessKeyId && secretAccessKey) {
  s3 = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
} else {
  warn("r2.disabled", { reason: "Missing endpoint or credentials" });
}

export async function getObject(Bucket, Key) {
  if (!s3) return null;
  try {
    const out = await s3.send(new GetObjectCommand({ Bucket, Key }));
    const buf = await out.Body.transformToByteArray();
    return new TextDecoder().decode(buf);
  } catch (err) {
    if (err?.$metadata?.httpStatusCode == 404) return null;
    error("r2.get.fail", { bucket: Bucket, key: Key, error: err.message });
    return null;
  }
}

export async function putText(Bucket, Key, text, ContentType = "text/plain; charset=utf-8") {
  if (!s3) throw new Error("R2 not configured");
  const Body = new TextEncoder().encode(text);
  await s3.send(new PutObjectCommand({ Bucket, Key, Body, ContentType }));
  info("r2.put", { bucket: Bucket, key: Key, bytes: Body.length });
}

export async function putJson(Bucket, Key, obj) {
  return putText(Bucket, Key, JSON.stringify(obj, null, 2), "application/json; charset=utf-8");
}