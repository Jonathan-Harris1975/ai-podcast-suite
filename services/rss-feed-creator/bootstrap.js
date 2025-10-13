// services/rss-feed-creator/bootstrap.js
// Ensures feeds.txt, urls.txt, and cursor.json exist in R2 from local /data sources.

import fs from "node:fs";
import path from "node:path";
import { getObject, putText, putJson } from "../shared/utils/r2-client.js";
import { info, error } from "../shared/utils/logger.js";

const RSS_BUCKET = process.env.R2_BUCKET_RSS_FEEDS;
const FEEDS_KEY = "feeds.txt";
const URLS_KEY = "urls.txt";
const CURSOR_KEY = "cursor.json";

export async function ensureR2Bootstrap() {
  try {
    if (!RSS_BUCKET) throw new Error("R2_BUCKET_RSS_FEEDS is missing");

    const baseDir = path.resolve("services/rss-feed-creator/data");
    const feedsPath = path.join(baseDir, FEEDS_KEY);
    const urlsPath = path.join(baseDir, URLS_KEY);

    const [feedsExists, urlsExists, cursorExists] = await Promise.all([
      getObject(RSS_BUCKET, FEEDS_KEY),
      getObject(RSS_BUCKET, URLS_KEY),
      getObject(RSS_BUCKET, CURSOR_KEY),
    ]);

    // feeds.txt
    if (!feedsExists && fs.existsSync(feedsPath)) {
      const feeds = fs.readFileSync(feedsPath, "utf-8");
      await putText(RSS_BUCKET, FEEDS_KEY, feeds);
      info("bootstrap.feeds.uploaded", { bucket: RSS_BUCKET, key: FEEDS_KEY });
    }

    // urls.txt
    if (!urlsExists && fs.existsSync(urlsPath)) {
      const urls = fs.readFileSync(urlsPath, "utf-8");
      await putText(RSS_BUCKET, URLS_KEY, urls);
      info("bootstrap.urls.uploaded", { bucket: RSS_BUCKET, key: URLS_KEY });
    }

    // cursor.json
    if (!cursorExists) {
      const cursor = { feedIndex: 0, urlIndex: 0 };
      await putJson(RSS_BUCKET, CURSOR_KEY, cursor);
      info("bootstrap.cursor.created", { bucket: RSS_BUCKET, key: CURSOR_KEY });
    }

    info("bootstrap.complete", { bucket: RSS_BUCKET });
    return true;
  } catch (err) {
    error("bootstrap.failed", { error: err.message });
    throw err;
  }
                                   }
