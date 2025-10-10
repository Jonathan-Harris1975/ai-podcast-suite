// /routes/rewrite.js — Final Express Router
import express from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/services/rewrite-pipeline.js";

const router = express.Router();

// GET check (quick test)
router.get("/", (req, res) => {
  console.log("🧩 rewrite GET ping");
  res.json({ ok: true, message: "rewrite endpoint reachable" });
});

// POST trigger (fire rewrite)
router.post("/", async (req, res) => {
  console.log("🧩 rss:rewrite-pipeline-start");
  try {
    setImmediate(async () => {
      try {
        await runRewritePipeline();
        console.log("🧩 rss:rewrite-pipeline-complete");
      } catch (err) {
        console.error("🧩 rss:rewrite-pipeline-error", err.message);
      }
    });
    res.status(202).json({ ok: true, message: "Rewrite pipeline triggered" });
  } catch (err) {
    console.error("❌ rss:rewrite-trigger-failed", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
