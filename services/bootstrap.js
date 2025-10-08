// services/bootstrap.js
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { log } from "../utils/logger.js";
import { getObject, putText, putJson } from "./rss-feed-creator/utils/r2-client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Compute a simple hash for logging/comparison
function sha256(s) {
  return crypto.createHash("sha256").update(s || "", "utf8").digest("hex").slice(0, 12);
}

// Try to locate the local data directory in every plausible place
function resolveDataDir() {
  const candidates = [
    // relative to this file (/app/.../services/bootstrap.js)
    path.resolve(__dirname, "../rss-feed-creator/data"),
    path.resolve(__dirname, "../../services/rss-feed-creator/data"),
    // relative to cwd
    path.resolve(process.cwd(), "services/rss-feed-creator/data"),
    path.resolve(process.cwd(), "ai-podcast-suite-main/services/rss-feed-creator/data"),
    // absolute fallbacks in Shiper-style containers
    "/app/services/rss-feed-creator/data",
    "/app/ai-podcast-suite-main/services/rss-feed-creator/data",
  ];
  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        return dir;
      }
    } catch (_) {}
  }
  return null;
}

// Read a local text file (and assert it’s non-empty)
function readLocalTextFile(dataDir, filename) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    log.error(`❌ Local data file missing: ${filePath}`);
    return { ok: false, content: "" };
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const size = Buffer.byteLength(content, "utf8");
  if (!content.trim()) {
    log.error(`❌ Local data file is empty: ${filePath}`);
    return { ok: false, content: "" };
  }
  log.info(`📖 Loaded ${filename} (${size} bytes, sha=${sha256(content)}) from ${filePath}`);
  return { ok: true, content };
}

export async function bootstrapR2() {
  log.info("🧩 Running R2 bootstrap...");

  const dataDir = resolveDataDir();
  if (!dataDir) {
    log.error("❌ Could not locate local data directory for feeds.txt / urls.txt");
    return;
  }
  log.info(`📂 Using data directory: ${dataDir}`);

  const feedsLocal = readLocalTextFile(dataDir, "feeds.txt");
  const urlsLocal  = readLocalTextFile(dataDir, "urls.txt");

  // Assert we have non-empty local files before touching R2
  if (!feedsLocal.ok || !urlsLocal.ok) {
    log.error("❌ Aborting bootstrap — refused to upload blank/missing files to R2.");
    return;
  }

  // Seed text file in R2 only if missing/empty
  async function ensureTextFile(key, localContent) {
    const existing = await getObject(key).catch(err => {
      log.error(`❌ R2 getObject(${key}) failed: ${err.message}`);
      return null;
    });

    if (existing && existing.trim()) {
      log.info(`ℹ️ ${key} already exists in R2 (${Buffer.byteLength(existing, "utf8")} bytes, sha=${sha256(existing)})`);
      return;
    }

    await putText(key, localContent);
    log.info(`✅ Uploaded ${key} to R2 (${Buffer.byteLength(localContent, "utf8")} bytes, sha=${sha256(localContent)})`);
  }

  // Ensure cursor.json exists
  async function ensureCursor() {
    const existing = await getObject("cursor.json").catch(() => null);
    if (existing && existing.trim() !== "{}") {
      log.info("ℹ️ cursor.json already present in R2");
      return;
    }
    const data = { lastUpdated: new Date().toISOString(), processed: [] };
    await putJson("cursor.json", data);
    log.info("✅ Seeded cursor.json in R2");
  }

  await ensureTextFile("feeds.txt", feedsLocal.content);
  await ensureTextFile("urls.txt", urlsLocal.content);
  await ensureCursor();

  log.info("✅ R2 bootstrap completed successfully");
}
