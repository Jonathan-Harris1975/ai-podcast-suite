// routes/rewrite.js
import { Router } from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/rewrite-pipeline.js";
import { info, error } from "../services/shared/utils/logger.js";

const router = Router();

router.get("/", (req, res) => {
  return res.status(200).json({ status: "ok", route: "rewrite" });
});

router.post("/run", async (req, res) => {
  info("rewrite: POST /run");
  try {
    const out = await runRewritePipeline();
    return res.status(200).json({ ok: true, ...out });
  } catch (err) {
    error("rewrite: pipeline failed", { error: err.message });
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;