// /app/routes/rss.js — Final Clean Version (2025.10.11)
import express from "express";
import { getObject } from "../services/shared/utils/r2-client.js";

const router = express.Router();

/**
 * GET /api/rss → Returns the latest RSS feed from R2 storage
 */
router.get("/", async (req, res) => {
  try {
    const xml = await getObject("rss.xml");

    if (!xml || typeof xml !== "string" || xml.trim().length === 0) {
      res.set("Content-Type", "application/rss+xml");
      return res.status(200).send(
        `<rss><channel><title>No RSS Found</title><description>Empty feed</description></channel></rss>`
      );
    }

    res.set("Content-Type", "application/rss+xml");
    return res.status(200).send(xml);
  } catch (err) {
    console.error("❌ RSS route failed:", err);
    res.status(500).json({
      success: false,
      error: err && err.message ? err.message : "Unknown RSS error",
    });
  }
});

export default router;
