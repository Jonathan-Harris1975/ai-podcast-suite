// /routes/rss.js
import express from "express";
import { rebuildRss } from "../services/rss-feed-creator/services/build-rss.js";
import { getObject } from "../services/shared/utils/r2-client.js";

const router = express.Router();

/**
 * GET /api/rss
 * Returns the current RSS XML from R2 (if available)
 */
router.get("/", async (req, res) => {
  try {
    const xml = await getObject("rss.xml");
    res.set("Content-Type", "application/rss+xml");
    res.send(xml || "<rss><channel><title>No RSS found</title></channel></rss>");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/rss/rebuild
 * Manual trigger for RSS rebuild.
 */
router.post("/rebuild", async (req, res) => {
  try {
    const items = await getObject("items.json");
    if (!items) throw new Error("No items found in R2");
    const parsed = JSON.parse(items);
    await rebuildRss(parsed);
    res.json({ ok: true, message: "RSS rebuild completed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
