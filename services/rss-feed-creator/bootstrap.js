// services/rss-feed-creator/bootstrap.js
import fs from "fs";
import path from "path";
import { R2_BUCKETS, uploadBuffer } from "#shared/r2-client.js";
import { log } from "#shared/logger.js";

const DATA_DIR = path.join(process.cwd(), "services/rss-feed-creator/data");

export async function uploadRssDataFiles() {
  const feedFile = path.join(DATA_DIR, "feeds.txt");
  const urlFile = path.join(DATA_DIR, "urls.txt");
  const bucket = R2_BUCKETS.RSS_FEEDS;

  const files = [
    { name: "feeds.txt", path: feedFile },
    { name: "urls.txt", path: urlFile },
  ];

  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      log.error("rss.bootstrap.missingFile", { file: file.path });
      continue;
    }

    const body = fs.readFileSync(file.path);
    await uploadBuffer({
      bucket,
      key: file.name,
      body,
      contentType: "text/plain",
    });

    log.info("rss.bootstrap.uploaded", { bucket, key: file.name });
  }

  log.info("rss.bootstrap.complete", { uploaded: files.length });
}

// Called automatically by main bootstrap sequence
if (process.env.SHIPER_BOOTSTRAP === "true") {
  uploadRssDataFiles().catch(err => log.error("rss.bootstrap.fail", { error: err.message }));
}
