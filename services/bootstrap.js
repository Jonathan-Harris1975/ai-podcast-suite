// services/bootstrap.js
import fs from "fs";
import path from "path";
import { log } from "../utils/logger.js";
import { getObject, putText, putJson } from "./rss-feed-creator/utils/r2-client.js";

export async function bootstrapR2() {
  log.info("🧩 Running R2 bootstrap check...");

  // Locate local data directory
  const dataDir = path.resolve("./services/rss-feed-creator/data");

  // Utility to read a local file safely
  const readLocalFile = (filename) => {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      log.warn(`⚠️ Local seed file not found: ${filename}`);
      return "";
    }
    return fs.readFileSync(filePath, "utf-8");
  };

  // Local file contents
  const localFeeds = readLocalFile("feeds.txt");
  const localUrls = readLocalFile("urls.txt");

  // Helper to seed R2 file if missing or empty
  async function ensureTextFile(key, localContent) {
    try {
      const existing = await getObject(key);
      if (!existing || !existing.trim()) {
        const contentToUpload = localContent?.trim()
          ? localContent
          : "# No feeds provided yet";
        await putText(key, contentToUpload);
        log.info(`✅ Seeded ${key} to R2 (${contentToUpload.length} bytes)`);
      } else {
        log.info(`ℹ️ ${key} already present in R2`);
      }
    } catch (err) {
      log.error(`❌ Failed checking ${key}: ${err.message}`);
    }
  }

  // Ensure JSON cursor
  async function ensureCursorFile() {
    try {
      const existing = await getObject("cursor.json");
      if (!existing || existing.trim() === "{}") {
        const defaultCursor = {
          lastUpdated: new Date().toISOString(),
          processed: [],
        };
        await putJson("cursor.json", defaultCursor);
        log.info("✅ Seeded cursor.json to R2");
      } else {
        log.info("ℹ️ cursor.json already present in R2");
      }
    } catch (err) {
      log.error(`❌ Failed checking cursor.json: ${err.message}`);
    }
  }

  // Perform bootstrap
  await ensureTextFile("feeds.txt", localFeeds);
  await ensureTextFile("urls.txt", localUrls);
  await ensureCursorFile();

  log.info("✅ R2 bootstrap check completed");
}
