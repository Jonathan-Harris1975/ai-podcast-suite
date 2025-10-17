// /routes/rss-health.js
import { Router } from "express";
import { R2_BUCKETS, getObjectAsText } from "#shared/r2-client.js";
import { log } from "#shared/logger.js";

const router = Router();

router.get("/rss-health", async (_req, res) => {
  try {
    const [feedsTxt, urlsTxt] = await Promise.all([
      getObjectAsText(R2_BUCKETS.RSS_FEEDS, "feeds.txt"),
      getObjectAsText(R2_BUCKETS.RSS_FEEDS, "urls.txt"),
    ]);

    const feedsOk = typeof feedsTxt === "string" && feedsTxt.trim().length > 0;
    const urlsOk = typeof urlsTxt === "string" && urlsTxt.trim().length > 0;

    res.json({
      status: feedsOk && urlsOk ? "ok" : "degraded",
      feedsBytes: feedsTxt?.length ?? 0,
      urlsBytes: urlsTxt?.length ?? 0,
    });
  } catch (err) {
    log.error("rss.health.error", { error: err.message });
    res.status(500).json({ status: "error", error: err.message });
  }
});

export default router;
