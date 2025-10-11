// /routes/rewrite.js — Fixed 2025.10.11
import express from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/index.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const result = await runRewritePipeline(req.body);
    res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("❌ rewrite error", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
