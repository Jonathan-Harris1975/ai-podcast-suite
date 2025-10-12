// routes/rewrite.js — Stable Rewrite Route (2025-10-12)
import express from "express";
const router = express.Router();

// ────────────────────────────────────────────────
// Structured logger (Render / Shiper friendly)
// ────────────────────────────────────────────────
function log(message, meta = null) {
  const entry = { time: new Date().toISOString(), message, ...(meta ? { meta } : {}) };
  try { process.stdout.write(JSON.stringify(entry) + "\n"); } catch {}
}

// ────────────────────────────────────────────────
// GET /api/rewrite → route info
// ────────────────────────────────────────────────
router.get("/", (req, res) => {
  log("rewrite: GET /");
  res.status(200).json({
    ok: true,
    route: "rewrite",
    endpoints: ["/api/rewrite", "/api/rewrite/ping", "/api/rewrite/run"],
  });
});

// ────────────────────────────────────────────────
// GET /api/rewrite/ping → health check
// ────────────────────────────────────────────────
router.get("/ping", (req, res) => {
  res.status(200).json({ ok: true, pong: true, ts: new Date().toISOString() });
});

// ────────────────────────────────────────────────
// POST /api/rewrite/run → triggers AI rewrite pipeline
// ────────────────────────────────────────────────
router.post("/run", async (req, res) => {
  log("rewrite: POST /run");

  try {
    // ✅ Fixed import path for Shiper container
    const mod = await import("../services/rss-feed-creator/rewrite-pipeline.js");
    const runRewritePipeline = mod?.runRewritePipeline || mod?.default;
    if (typeof runRewritePipeline !== "function") {
      throw new Error("runRewritePipeline() not exported or invalid");
    }

    const result = await runRewritePipeline();
    log("rewrite: pipeline completed", { count: result?.count || 0 });

    res.status(200).json({
      ok: true,
      route: "rewrite",
      message: "Pipeline completed successfully",
      result,
    });
  } catch (err) {
    log("rewrite: pipeline failed", { error: err.message });
    res.status(500).json({
      ok: false,
      route: "rewrite",
      error: err.message,
      stack:
        process.env.NODE_ENV === "development"
          ? err.stack
          : undefined,
    });
  }
});

export default router;
