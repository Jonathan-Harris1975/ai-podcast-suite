// services/bootstrap.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "../utils/logger.js";
import { getObject, putText, putJson } from "./rss-feed-creator/utils/r2-client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function bootstrapR2() {
  log.info("🧩 Running R2 bootstrap...");

  // 🔍 1. Dynamically resolve the data directory
  const searchDirs = [
    path.resolve(__dirname, "../rss-feed-creator/data"),
    path.resolve(__dirname, "../../services/rss-feed-creator/data"),
    path.resolve("/app/services/rss-feed-creator/data"),
    path.resolve("/app/ai-podcast-suite-main/services/rss-feed-creator/data"),
  ];

  let dataDir = searchDirs.find((dir) => fs.existsSync(dir));
  if (!dataDir) {
    log.error("❌ No local data directory found for feeds.txt / urls.txt");
    return;
  }

  log.info(`📂 Using data directory: ${dataDir}`);

  // 🔧 Helper to read a file
  const readFileSafe = (filename) => {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      log.warn(`⚠️ Local file not found: ${filename}`);
      return "";
    }
    const content = fs.readFileSync(filePath, "utf-8").trim();
    log.info(`📖 Loaded ${filename} (${content.length} bytes)`);
    return content;
  };

  const feedsLocal = readFileSafe("feeds.txt");
  const urlsLocal = readFileSafe("urls.txt");

  // 🔧 Helper to upload file if missing
  async function ensureTextFile(key, localData) {
    try {
      const existing = await getObject(key);
      if (!existing || !existing.trim()) {
        const content = localData?.trim()
          ? localData
          : "# default placeholder\nhttps://techcrunch.com/feed/\nhttps://www.theverge.com/rss/index.xml";
        await putText(key, content);
        log.info(`✅ Uploaded ${key} (${content.length} bytes)`);
      } else {
        log.info(`ℹ️ ${key} already present in R2`);
      }
    } catch (err) {
      log.error(`❌ Error ensuring ${key}: ${err.message}`);
    }
  }

  // 🔧 Cursor JSON
  async function ensureCursor() {
    try {
      const existing = await getObject("cursor.json");
      if (!existing || existing.trim() === "{}") {
        const data = {
          lastUpdated: new Date().toISOString(),
          processed: [],
        };
        await putJson("cursor.json", data);
        log.info("✅ Seeded cursor.json");
      } else {
        log.info("ℹ️ cursor.json already exists");
      }
    } catch (err) {
      log.error(`❌ Failed to create cursor.json: ${err.message}`);
    }
  }

  await ensureTextFile("feeds.txt", feedsLocal);
  await ensureTextFile("urls.txt", urlsLocal);
  await ensureCursor();

  log.info("✅ R2 bootstrap completed successfully");
}
