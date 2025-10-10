// /routes/rewrite.js
import express from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/services/rewrite-pipeline.js";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("🧩 rss:rewrite-pipeline-start");
  setImmediate(async () => {
    try {
      await runRewritePipeline();
      console.log("🧩 rss:rewrite-pipeline-complete");
    } catch (err) {
      console.error("🧩 rss:rewrite-pipeline-error", err.message);
    }
  });
  res.status(202).json({ ok: true, message: "Rewrite pipeline triggered" });
});

export default router;
