// services/rss-feed-creator/routes/index.js
import express from "express";
import { log } from "../../../utils/logger.js";

const router = express.Router();

// Root endpoint for RSS Feed Creator
router.get("/", (req, res) => {
  log.info("📰 RSS Feed Creator root route hit");
  res.json({ ok: true, service: "rss-feed-creator" });
});

// Example: generate feed (placeholder logic)
router.get("/generate", async (req, res) => {
  // TODO: Replace this with your feed generation logic
  res.json({
    message: "RSS Feed generated successfully (placeholder)",
    timestamp: new Date().toISOString(),
  });
});

export default router;
