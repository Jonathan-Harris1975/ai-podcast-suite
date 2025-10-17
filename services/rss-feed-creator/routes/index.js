// services/rss-feed-creator/routes/index.js
import { s3, R2_BUCKETS, uploadBuffer, listKeys, getObjectAsText } from "#shared/r2-client.js";
import express from "express";
import { log } from "#shared/logger.js"; // ⬅ fix this path

const router = express.Router();

router.get("/", (req, res) => {
  log.info("rss.root");
  res.json({ ok: true, service: "rss-feed-creator" });
});

export default router;
