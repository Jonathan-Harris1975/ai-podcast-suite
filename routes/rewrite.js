// routes/rewrite.js — CLEAN MINIMAL ROUTER
import express from "express";

const router = express.Router();

// Tiny helper so logs are structured in Render/shiper
function log(message, meta = null) {
  const entry = { time: new Date().toISOString(), message, ...(meta ? { meta } : {}) };
  // Use stdout so platform log capture works
  try { process.stdout.write(JSON.stringify(entry) + "\n"); } catch { /* noop */ }
}

// Health/info
router.get("/", (req, res) => {
  log("rewrite: GET /");
  res.status(200).json({
    ok: true,
    route: "rewrite",
    endpoints: ["/api/rewrite", "/api/rewrite/run", "/api/rewrite/ping"]
  });
});

// Simple ping
router.get("/ping", (req, res) => {
  res.status(200).json({ ok: true, pong: true });
});

// Trigger the rewrite pipeline on-demand
router.post("/run", async (req, res) => {
  log("rewrite: POST /run");
  try {
    // ⚠️ LAZY IMPORT so a bad module doesn't break route mounting
    const mod = await import("../services/rss-feed-creator/services/rewrite-pipeline.js");
    const runRewritePipeline = mod?.runRewritePipeline || mod?.default;
    if (typeof runRewritePipeline !== "function") {
      throw new Error("runRewritePipeline not exported from rewrite-pipeline.js");
    }

    const result = await runRewritePipeline();
    res.status(200).json({ ok: true, result });
  } catch (err) {
    log("rewrite: pipeline error", { error: err?.message });
    res.status(500).json({
      ok: false,
      route: "rewrite",
      error: err?.message || "Unknown error"
    });
  }
});

export default router;
