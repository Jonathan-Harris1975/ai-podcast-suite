// server.js — AI Podcast Suite (2025.10.10-UltimateRouteFix)
import express from "express";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";

// ── Logger ─────────────────────────────────────────
function log(message, meta = null) {
  const entry = { time: new Date().toISOString(), message, ...(meta ? { meta } : {}) };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ── Health Check ───────────────────────────────────
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.json({ ok: true, uptime: `${Math.round(process.uptime())}s`, env: NODE_ENV });
});

// ── Route Loader (synchronous + absolute URLs) ─────
try {
  const rewriteUrl = pathToFileURL(path.join(__dirname, "routes/rewrite.js")).href;
  const podcastUrl = pathToFileURL(path.join(__dirname, "routes/podcast.js")).href;

  const rewriteModule = await import(rewriteUrl);
  const podcastModule = await import(podcastUrl);

  if (rewriteModule?.default) {
    app.use("/api/rewrite", rewriteModule.default);
    log("✅ Mounted /api/rewrite");
  } else {
    log("⚠️ rewrite.js missing default export");
  }

  if (podcastModule?.default) {
    app.use("/api/podcast", podcastModule.default);
    log("✅ Mounted /api/podcast");
  }

  // 🧩 Debug routes endpoint
  app.get("/api/debug/routes", (req, res) => {
    const list = [];
    app._router.stack.forEach(mw => {
      if (mw.route) {
        const methods = Object.keys(mw.route.methods).map(m => m.toUpperCase());
        list.push({ path: mw.route.path, methods });
      } else if (mw.name === "router" && mw.handle.stack) {
        mw.handle.stack.forEach(handler => {
          if (handler.route) {
            const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase());
            list.push({
              base: mw.regexp?.source,
              path: handler.route.path,
              methods,
            });
          }
        });
      }
    });
    res.json({ routes: list });
  });

  log("✅ All routes mounted successfully");
} catch (err) {
  log("❌ Route load failure", { error: err.message });
}

// ── 404 Handler (last) ─────────────────────────────
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl });
  res.status(404).json({ error: "Endpoint not found" });
});

// ── Start Server ───────────────────────────────────
app.listen(PORT, () => log(`🚀 Server running on port ${PORT} (${NODE_ENV})`));
