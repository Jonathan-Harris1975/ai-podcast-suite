// services/bootstrap.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "../utils/logger.js";
import { getObject, putText, putJson } from "./rss-feed-creator/utils/r2-client.js";

// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function bootstrapR2() {
  log.info("🧩 Running R2 bootstrap check...");

  // Try multiple data directories (local & deployed)
  const candidateDirs = [
    path.resolve(__dirname, "../rss-feed-creator/data"), // local dev
    path.resolve(__dirname, "../../ai-podcast-suite-main/services/rss-feed-creator/data"), // Shiper container
    path.resolve("/app/ai-podcast-suite-main/services/rss-feed-creator/data"), // explicit absolute
  ];

  let dataDir = candidateDirs.find((dir) => fs.existsSync(dir));
  if (!dataDir) {
    log.warn("⚠️ Could not locate local data directory for feeds.txt / urls.txt");
    return;
  }

  log.info(`📂 Using data directory: ${dataDir}`);

  // Helper to safely read a local file
  const readLocalFile = (filename) => {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      log.warn(`⚠️ Local seed file not found: ${filename}`);
      return "";
    }
    const data = fs.readFileSync(filePath, "utf-8");
    log.info(`📖 Loaded ${filename} (${data.length} bytes)`);
    return data;
  };

  const localFeeds = readLocalFile("feeds.txt");
  const localUrls = readLocalFile("urls.txt");

  // Seed text file if missing or empty in R2
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

  // Ensure JSON cursor file
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

  // Execute
  await ensureTextFile("feeds.txt", localFeeds);
  await ensureTextFile("urls.txt", localUrls);
  await ensureCursorFile();

  log.info("✅ R2 bootstrap check completed");
}
