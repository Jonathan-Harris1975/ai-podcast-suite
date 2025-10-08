// services/rss-feed-creator/utils/r2-client.js
import fetch from "node-fetch";
import { log } from "../../../utils/logger.js";

const endpoint = process.env.R2_ENDPOINT;
const region   = process.env.R2_REGION || "auto";

if (!endpoint || !endpoint.includes(".r2.cloudflarestorage.com")) {
  throw new Error("❌ Invalid or missing R2_ENDPOINT — must point to Cloudflare R2 (e.g. https://xxxx.r2.cloudflarestorage.com)");
}

log.info(`☁️ Connecting to Cloudflare R2 endpoint: ${endpoint}`);
log.info(`✅ R2 endpoint verified (region: ${region})`);

export async function getObject(key) {
  const url = `${endpoint}/${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${key} failed: ${res.statusText}`);
  return await res.text();
}

export async function putText(key, content) {
  const url = `${endpoint}/${key}`;
  const res = await fetch(url, {
    method: "PUT",
    body: content,
    headers: { "Content-Type": "text/plain" }
  });
  if (!res.ok) throw new Error(`PUT ${key} failed: ${res.statusText}`);
  log.info(`📦 Text uploaded to R2: ${key}`);
}

export async function putJson(key, data) {
  await putText(key, JSON.stringify(data, null, 2));
}
