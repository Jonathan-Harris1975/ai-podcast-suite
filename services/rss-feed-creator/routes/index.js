import { s3, R2_BUCKETS, validateR2Once, uploadBuffer, listKeys, getObjectAsText } from "../../r2-client.js";
// services/rss-feed-creator/routes/index.js
import express from "express";
import { log } from "../../../utils/logger.js";

const router = express.Router();

router.get("/", (req, res) => {
  log.info("📰 RSS Feed Creator root route hit");
  res.json({ ok: true, service: "rss-feed-creator" });
});

export default router;
