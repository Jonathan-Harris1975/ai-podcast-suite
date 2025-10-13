import express from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/rewrite-pipeline.js";
import { log } from "../services/shared/utils/logger.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ route: "rewrite", ok: true });
});

router.post("/run", async (req, res) => {
  log("rewrite: POST /run");
  try {
    const out = await runRewritePipeline();
    res.status(200).json({ ok: true, ...out });
  } catch (err) {
    log("rewrite: pipeline failed", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
