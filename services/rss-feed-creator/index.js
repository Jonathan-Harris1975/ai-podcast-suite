import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const log = (emoji, message, meta = {}) => {
  const entry = {
    time: new Date().toISOString(),
    message: `${emoji} ${message}`,
    ...(Object.keys(meta).length ? { meta } : {})
  };
  process.stdout.write(JSON.stringify(entry) + "\n");
};

export default async function startFeedCreator() {
  const utilsDir = path.resolve("services/rss-feed-creator/utils");
  const candidates = [
    "feedGenerator.js",
    "feed-builder.js",
    "feedBuild.js",
    "rssFeed.js",
    "rss-generator.js"
  ];

  for (const file of candidates) {
    const fullPath = path.join(utilsDir, file);
    if (fs.existsSync(fullPath)) {
      try {
        const mod = await import(pathToFileURL(fullPath).href);
        if (typeof mod.default === "function") {
          await mod.default();
          log("🧠", "Auto-resolved RSS util", { util: file });
          return;
        }
      } catch (err) {
        log("❌", "Error running RSS util", { util: file, error: err.message });
      }
    }
  }

  log("⚠️", "No feed utility found, RSS Feed Creator idle");
}
