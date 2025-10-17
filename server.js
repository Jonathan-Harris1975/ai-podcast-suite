// ============================================================
// 🧠 AI Podcast Suite — Main Server
// ============================================================
//
// Ensures correct Express initialization order.
// Dynamically loads runPodcastPipeline to avoid import errors.
// ============================================================

import express from "express";
import cors from "cors";
import { log } from "#shared/logger.js";
import rssHealthRouter from "./routes/rss-health.js";

// ------------------------------------------------------------
// ⚙️ Initialize Express before any .use() calls
// ------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// 🌐 Routes
// ------------------------------------------------------------
app.use("/rss-health", rssHealthRouter);

// Dynamic import avoids hard failure if file missing or unexported
app.post("/run-pipeline", async (req, res) => {
  try {
    const { runPipeline } = await import("./services/podcast/runPodcastPipeline.js");
    if (typeof runPipeline !== "function") {
      throw new Error("runPipeline() not exported from runPodcastPipeline.js");
    }

    const result = await runPipeline(req.body || {});
    res.status(200).json({ success: true, result });
  } catch (err) {
    log.error("❌ run-pipeline route failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------------------------------------------------
// 🚀 Server Startup
// ------------------------------------------------------------
app.listen(PORT, () => {
  log.info(`🌍 AI Podcast Suite running on port ${PORT}`);
});

export default app;
