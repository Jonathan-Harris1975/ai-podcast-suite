// routes/rewrite.js
import express from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/rewrite-pipeline.js";
import { info, error } from "../services/shared/utils/logger.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ route: "rewrite", status: "ok" });
});

router.post("/run", async (req, res) => {
  info("rewrite: POST /run");
  try {
    const result = await runRewritePipeline();
    res.status(200).json(result);
  } catch (err) {
    error("rewrite: pipeline failed", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
