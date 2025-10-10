// routes/rss.js
import express from "express";
import { log } from "../utils/logger.js";
import { getObject } from "../services/shared/utils/r2-client.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    log.debug("📡 GET /rss requested");
    const rss = await getObject("data/rss.xml");
    if (!rss) {
      log.warn("RSS feed not found at data/rss.xml");
      res.status(404).send("RSS feed not found");
      return;
    }
    res.set("Content-Type", "application/rss+xml; charset=utf-8");
    log.info(`📰 RSS feed served (length: ${typeof rss === "string" ? rss.length : (rss?.length || 0)} bytes)`);
    res.send(rss);
  } catch (err) {
    log.error(`❌ Error fetching RSS: ${err?.message || err}`);
    res.status(500).send("Internal server error");
  }
});

export default router;
