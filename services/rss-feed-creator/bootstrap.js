// services/rss-feed-creator/bootstrap.js
import fs from "fs/promises";
import path from "path";
import { putText, putJson } from "./utils/r2-client.js";
import { log } from "../../utils/logger.js";

const dataDir = "/app/services/rss-feed-creator/data";

export async function bootstrapR2() {
  log.info("🧩 Running R2 bootstrap...");
  log.info(`📂 Using data directory: ${dataDir}`);

  const files = [
    { key: "feeds.txt", type: "text", bucket: process.env.R2_BUCKET_RSS_FEEDS },
    { key: "urls.txt", type: "text", bucket: process.env.R2_BUCKET_RSS_FEEDS },
    { key: "cursor.json", type: "json", bucket: process.env.R2_BUCKET_RSS_FEEDS }
  ];

  for (const f of files) {
    const localPath = path.join(dataDir, f.key);
    let content;

    try {
      content = await fs.readFile(localPath, "utf8");
      if (!content.trim()) throw new Error("empty");
      log.info(`📖 Loaded ${f.key} (${content.length} bytes) from ${localPath}`);
    } catch {
      log.warn(`⚠️ ${f.key} missing locally — seeding default`);
      if (f.type === "text") content = "# Auto-created by bootstrap\n";
      else content = JSON.stringify({ cursor: 0, updated: new Date().toISOString() });
    }

    try {
      if (f.type === "text") await putText(f.key, content);
      else await putJson(f.key, JSON.parse(content));
      log.info(`✅ Uploaded ${f.key} (${content.length} bytes) to ${f.bucket}`);
    } catch (err) {
      log.error(`❌ Failed to upload ${f.key}: ${err.message}`);
    }
  }

  log.info("✅ R2 bootstrap completed\n");
}
