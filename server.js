// ============================================================
// 🧠 AI Podcast Suite — Main Server (Final Stable Build)
// ============================================================
//
// Prevents early variable access (ReferenceError).
// Initializes Express before any route/middleware.
// Dynamically loads orchestrator only when invoked.
// ============================================================

import express from "express";
import cors from "cors";
import { log } from "#shared/logger.js";

// ------------------------------------------------------------
// ⚙️ Initialize Express FIRST
// ------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// 🧩 Safe Lazy Imports (after app is defined)
// ------------------------------------------------------------
(async () => {
  try {
    const { default: rssHealthRouter } = await import("./routes/rss-health.js");
    app.use("/rss-health", rssHealthRouter);

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
    // 🚀 Start Server only after all routes load
    // ------------------------------------------------------------
    app.listen(PORT, () => {
      log.info(`🌍 AI Podcast Suite server running on port ${PORT}`);
    });
  } catch (err) {
    log.error("❌ Server startup failed", { error: err.message });
  }
})();
