import express from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/services/rewrite-pipeline.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const result = await runRewritePipeline();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("❌ Rewrite route failed", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
