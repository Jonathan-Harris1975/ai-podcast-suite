// Ensures feeds.txt and urls.txt exist in R2 by uploading local copies if missing
import { r2Head, r2Put, r2GetPublicBase, getBucketName } from "./r2Client.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function jlog(message, meta = undefined) {
  const line = { time: new Date().toISOString(), message };
  if (meta && typeof meta === "object") line.meta = meta;
  process.stdout.write(JSON.stringify(line) + "\n");
}

const PREFIX = "rss-feeds/";
const FILES = ["feeds.txt", "urls.txt"];

export async function ensureBootstrapFiles() {
  const bucket = getBucketName();
  const publicBase = r2GetPublicBase();
  for (const name of FILES) {
    const key = PREFIX + name;
    let exists = false;
    try {
      const head = await r2Head(bucket, key);
      exists = head?.$metadata?.httpStatusCode === 200;
    } catch (_) {}
    if (exists) continue;

    const localPath = path.resolve(__dirname, "..", "data", name);
    if (!fs.existsSync(localPath)) {
      jlog("⚠️ bootstrap:local-missing", { file: name });
      continue;
    }
    const body = fs.readFileSync(localPath);
    await r2Put(bucket, key, body, "text/plain; charset=utf-8");
    jlog("📰 bootstrap:uploaded", { key, url: `${publicBase}/${key}` });
  }
}
