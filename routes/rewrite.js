// /routes/rewrite.js 
import express from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/services/rewrite-pipeline.js";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("🧩 rss:rewrite-pipeline-start");
  try {
    // Fire-and-forget async trigger
    runRewritePipeline()
      .then(result => console.log("🧩 rss:rewrite-pipeline-complete", result))
      .catch(err => console.error("🧩 rss:rewrite-pipeline-error", err.message));

    res.status(202).json({ ok: true, message: "Rewrite pipeline started" });
  } catch (err) {
    console.error("❌ rss:rewrite-pipeline-trigger-failed", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
