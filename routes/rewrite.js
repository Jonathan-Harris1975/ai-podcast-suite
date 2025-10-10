// /routes/rewrite.js
import express from "express";
const router = express.Router();

router.post("/", async (req, res) => {
  console.log("🧩 rss:rewrite-pipeline-start");
  setImmediate(async () => {
    try {
      const { runRewritePipeline } = await import("../services/rss-feed-creator/services/rewrite-pipeline.js");
      await runRewritePipeline();
      console.log("🧩 rss:rewrite-pipeline-complete");
    } catch (err) {
      console.error("🧩 rss:rewrite-pipeline-error", err?.message || err);
    }
  });
  res.status(202).json({ ok: true, message: "Rewrite pipeline triggered" });
});

export default router;
