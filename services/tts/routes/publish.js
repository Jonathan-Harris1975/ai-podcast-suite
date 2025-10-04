import express from "express";
const router = express.Router();

router.post("/complete", (req, res) => {
  const { sessionId, episodeUrl, rssItemUrl } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
  res.json({ status: "published_ack", sessionId, episodeUrl, rssItemUrl });
});

export default router;
