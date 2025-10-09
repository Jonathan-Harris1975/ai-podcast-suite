import { s3, R2_BUCKETS, validateR2Once, uploadBuffer, listKeys, getObjectAsText } from "../../r2-client.js";
// services/bootstrap.js
import fs from "fs";
import path from "path";
import { log } from "../../../utils/logger.js";
import { putJson, putText, getObject } from "../utils/r2-client.js";

// Hard-coded list of required bootstrap files
const REQUIRED_FILES = [
  { key: "items.json", type: "json", default: [] },
  { key: "rss.xml", type: "xml", default: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>GenX Newsletter + Podcast Feed</title>
    <link>https://jonathan-harris.online</link>
    <description>AI-powered RSS monitoring, rewriting, and podcast publishing system</description>
  </channel>
</rss>` },
  { key: "feeds.txt", type: "text", default: "" },
  { key: "urls.txt", type: "text", default: "" }
];

/**
 * Ensure all required bootstrap files exist in R2.
 */
export async function bootstrapR2() {
  log.info("🔍 Bootstrapping R2 with required files...");

  for (const file of REQUIRED_FILES) {
    try {
      // Check if file already exists in R2
      let exists = false;
      try {
        const obj = await getObject(file.key);
        exists = !!obj;
      } catch (e) {
        exists = false;
      }

      if (exists) {
        log.info({ key: file.key }, "✅ File already exists in R2");
        continue;
      }

      // If missing, create locally then upload
      const localPath = path.join("/app", file.key);
      fs.mkdirSync(path.dirname(localPath), { recursive: true });

      if (file.type === "json") {
        fs.writeFileSync(localPath, JSON.stringify(file.default, null, 2));
        await putJson(file.key, file.default);
      } else {
        fs.writeFileSync(localPath, file.default);
        await putText(file.key, file.default);
      }

      log.info({ key: file.key }, `🆕 Created and uploaded missing ${file.key}`);
    } catch (err) {
      log.error({ key: file.key, err }, `❌ Could not bootstrap ${file.key}`);
    }
  }

  log.info("✅ R2 bootstrap complete");
}
