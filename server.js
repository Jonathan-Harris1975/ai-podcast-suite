// ============================================================
// 🧠 AI Podcast Suite — Main Server
// ============================================================
//
// Central Express server for health routes and orchestrator API.
// Ensures all middleware and routers are attached *after* app init.
// ============================================================

import express from "express";
import cors from "cors";
import { log } from "#shared/logger.js";
import rssHealthRouter from "./routes/rss-health.js";
import { runPipeline } from "./services/podcast/runPodcastPipeline.js"; // optional: orchestrator entry

// ------------------------------------------------------------
// ⚙️ App Initialization
// ------------------------------------------------------------
const app = express(); // ✅ must come before any use() calls
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// 🌐 Routes
// ------------------------------------------------------------

// Health check
app.use("/rss-health", rssHealthRouter);

// Podcast orchestrator (optional route)
app.post("/run-pipeline", async (req, res) => {
  try {
    const result = await runPipeline(req.body || {});
    res.status(200).json({ success: true, result });
  } catch (err) {
    log.error("❌ Pipeline execution failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------------------------------------------------
// 🚀 Startup
// ------------------------------------------------------------
app.listen(PORT, () => {
  log.info(`🌍 AI Podcast Suite server running on port ${PORT}`);
});

export default app;
