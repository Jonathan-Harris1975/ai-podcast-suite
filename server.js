// server.js — AI Podcast Suite (2025.10.10-FinalRouteLock)
import express from "express";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";

// ─────────── LOGGER ───────────
function log(message, meta = null) {
  const entry = { time: new Date().toISOString(), message, ...(meta ? { meta } : {}) };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ─────────── HEALTH ───────────
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.status(200).json({
    status: "ok",
    uptime: `${Math.round(process.uptime())}s`,
    environment: NODE_ENV,
  });
});

// ─────────── ROUTE MOUNTS ───────────
import rewriteRouter from "./routes/rewrite.js";
import podcastRouter from "./routes/podcast.js";

// Mount them immediately, before 404
app.use("/api/rewrite", rewriteRouter);
log("✅ /api/rewrite router attached");

app.use("/api/podcast", podcastRouter);
log("✅ /api/podcast router attached");

// Diagnostic route list (optional)
app.get("/api/debug/routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach(mw => {
    if (mw.route) {
      const methods = Object.keys(mw.route.methods).map(m => m.toUpperCase());
      routes.push({ path: mw.route.path, methods });
    } else if (mw.name === "router" && mw.handle.stack) {
      mw.handle.stack.forEach(handler => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase());
          routes.push({ path: handler.route.path, methods, base: mw.regexp?.source });
        }
      });
    }
  });
  res.json({ routes });
});

// ─────────── 404 LAST ───────────
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl, method: req.method });
  res.status(404).json({ error: "Endpoint not found" });
});

// ─────────── STARTUP ───────────
app.listen(PORT, () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
});
