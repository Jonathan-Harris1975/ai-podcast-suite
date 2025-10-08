// routes/rewrite.js
import express from "express";
import { log } from "../utils/logger.js";
import { runRewritePipeline } from "/app/services/rss-feed-creator/services/rewrite-pipeline.js";

const router = express.Router();

// ─────────────────────────────────────────────
// Simple GET ping for quick diagnostics
// ─────────────────────────────────────────────
router.get("/rewrite/ping", (req, res) => {
  log.info("✅ GET /api/rewrite/ping reached");
  res.json({ ok: true, route: "/api/rewrite", method: "GET" });
});

// ─────────────────────────────────────────────
// Rewrite trigger route
// ─────────────────────────────────────────────
router.post("/rewrite", async (req, res) => {
  log.info("✅ POST /api/rewrite received");

  if (typeof runRewritePipeline !== "function") {
    log.warn("⚠️ runRewritePipeline not found. Skipping execution.");
    return res
      .status(501)
      .json({ error: "rewrite pipeline not found or not loaded" });
  }

  try {
    log.info("🚀 Starting rewrite pipeline...");
    const result = await runRewritePipeline();
    log.info("🎯 Rewrite pipeline executed successfully");
    res.json({ ok: true, result });
  } catch (err) {
    log.error(`❌ Rewrite route error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

export default router;
