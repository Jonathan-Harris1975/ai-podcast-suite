// services/rss-feed-creator/bootstrap.js
// Full integration with rewrite pipeline + R2 client consistency

import fs from "node:fs";
import path from "node:path";
import { getObject, putText, putJson } from "../shared/utils/r2-client.js";
import { info, error } from "../shared/utils/logger.js";

const FEEDS_KEY = "feeds.txt";
const URLS_KEY = "urls.txt";
const CURSOR_KEY = "cursor.json";
const RSS_BUCKET = process.env.R2_BUCKET_RSS_FEEDS;

/**
 * Ensure feeds.txt, urls.txt, and cursor.json exist in the rss-feeds bucket.
 * Copies from /services/rss-feed-creator/data if missing.
 */
export async function ensureR2Bootstrap() {
  try {
    if (!RSS_BUCKET) throw new Error("R2_BUCKET_RSS_FEEDS env missing");

    const baseDir = path.resolve("services/rss-feed-creator/data");
    const feedsPath = path.join(baseDir, FEEDS_KEY);
    const urlsPath = path.join(baseDir, URLS_KEY);

    // Try to load from R2
    const [feeds, urls, cursor] = await Promise.all([
      getObject(RSS_BUCKET, FEEDS_KEY),
      getObject(RSS_BUCKET, URLS_KEY),
      getObject(RSS_BUCKET, CURSOR_KEY),
    ]);

    // Upload feeds.txt if missing
    if (!feeds && fs.existsSync(feedsPath)) {
      const localFeeds = fs.readFileSync(feedsPath, "utf-8");
      await putText(RSS_BUCKET, FEEDS_KEY, localFeeds);
      info("bootstrap.upload", { key: FEEDS_KEY, bucket: RSS_BUCKET });
    }

    // Upload urls.txt if missing
    if (!urls && fs.existsSync(urlsPath)) {
      const localUrls = fs.readFileSync(urlsPath, "utf-8");
      await putText(RSS_BUCKET, URLS_KEY, localUrls);
      info("bootstrap.upload", { key: URLS_KEY, bucket: RSS_BUCKET });
    }

    // Create cursor.json if missing
    if (!cursor) {
      const cursorObj = { feedIndex: 0, urlIndex: 0 };
      await putJson(RSS_BUCKET, CURSOR_KEY, cursorObj);
      info("bootstrap.cursor", { key: CURSOR_KEY, bucket: RSS_BUCKET });
    }

    info("bootstrap.ready", { bucket: RSS_BUCKET });
    return true;
  } catch (err) {
    error("bootstrap.error", { error: err.message });
    throw err;
  }
}
