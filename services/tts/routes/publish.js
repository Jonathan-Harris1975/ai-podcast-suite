import {s3, R2_BUCKETS, uploadBuffer, listKeys, getObjectAsText} from "../../r2-client.js";
import express from "express";
const router = express.Router();

router.post("/complete", (req, res) => {
  const { sessionId, episodeUrl, rssItemUrl } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
  res.json({ status: "published_ack", sessionId, episodeUrl, rssItemUrl });
});

export default router;
