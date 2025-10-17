// /server.js — AI Podcast Suite (updated 2025-10-15)
import express from "express";
import process from "node:process";
import fs from "node:fs";
import { info, error } from "./services/shared/utils/logger.js";

import rewriteRouter from "./routes/rewrite.js";
import podcastRouter from "./routes/podcast.js";
import rssHealthRouter from "#routes/rss-health.js";
app.use(rssHealthRouter);
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = (process.env.NODE_ENV || "production").toLowerCase();

// ────────────────────────────────────────────────
// Logging helpers
// ────────────────────────────────────────────────
function log(message, meta) {
  info(message, meta); // Use shared logger
}

// Preflight check
log("🧩 Preflight check", {
  rewriteExists: fs.existsSync("./routes/rewrite.js"),
  podcastExists: fs.existsSync("./routes/podcast.js"),
});

// ────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────
app.use("/api/rewrite", rewriteRouter);
log("✅ Mounted /api/rewrite");

app.use("/api/podcast", podcastRouter);
log("✅ Mounted /api/podcast");

// Root + Health
app.get("/", (_req, res) => {
  res.json({
    message: "🧠 AI Podcast Suite is live",
    endpoints: ["/api/rewrite/run", "/api/podcast"],
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: NODE_ENV });
});

// 404 handler
app.use((req, res) => {
  error("⚠️ 404 Not Found", { path: req.originalUrl });
  res.status(404).json({ error: "Endpoint not found", path: req.originalUrl });
});

// Start server
app.listen(PORT, () => {
  info("🚀 Server listening", { PORT: String(PORT), NODE_ENV });
});
