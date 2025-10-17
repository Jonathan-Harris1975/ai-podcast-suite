// ============================================================
// 🩺 AI Podcast Suite — RSS Health Check Route
// ============================================================
//
// Purpose:
//   • Confirms presence and validity of RSS-related files in R2.
//   • Checks feeds.txt, urls.txt, and feed.xml.
//   • Returns structured JSON for Make.com and dashboard monitoring.
//
// Logs:
//   • rss.health.status
//   • rss.health.fail
//   • rss.health.missingFeeds / rss.health.missingUrls
//
// ============================================================

import express from "express";
import { R2_BUCKETS, getObjectAsText, getObject } from "#shared/r2-client.js";
import { log } from "#shared/logger.js";

const router = express.Router();
const bucket = R2_BUCKETS.RSS_FEEDS;

// ------------------------------------------------------------
// 🧩 GET /api/rss/health
// ------------------------------------------------------------
router.get("/api/rss/health", async (req, res) => {
  const result = {
    feeds: 0,
    urls: 0,
    feedXml: false,
    status: "unknown",
  };

  try {
    // --- Check feeds.txt ---
    try {
      const feedsTxt = await getObjectAsText(bucket, "feeds.txt");
      result.feeds = feedsTxt
        ? feedsTxt.split(/\r?\n/).filter((line) => line.trim().length > 0).length
        : 0;
    } catch (err) {
      log.warn("rss.health.missingFeeds", { error: err.message });
    }

    // --- Check urls.txt ---
    try {
      const urlsTxt = await getObjectAsText(bucket, "urls.txt");
      result.urls = urlsTxt
        ? urlsTxt.split(/\r?\n/).filter((line) => line.trim().length > 0).length
        : 0;
    } catch (err) {
      log.warn("rss.health.missingUrls", { error: err.message });
    }

    // --- Check feed.xml ---
    try {
      const buf = await getObject(bucket, "feed.xml");
      result.feedXml = buf && buf.length > 0;
    } catch {
      result.feedXml = false;
    }

    // --- Determine status ---
    if (result.feeds > 0 && result.urls > 0 && result.feedXml) {
      result.status = "ok";
    } else if (result.feeds === 0 && result.urls === 0) {
      result.status = "empty";
    } else {
      result.status = "incomplete";
    }

    log.info("rss.health.status", result);
    return res.json(result);
  } catch (err) {
    log.error("rss.health.fail", { error: err.message });
    return res.status(500).json({
      status: "error",
      message: err.message,
      ...result,
    });
  }
});

export default router;
