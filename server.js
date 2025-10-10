// AI Podcast Suite Server – Shiper Optimized v2025.10.10
// Stable for always-on /health pings + JSON logging
import express from "express";
import process from "node:process";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERSION = "2025.10.10-Ship";
const NODE_ENV = process.env.NODE_ENV || "production";

// ---- LOGGING (instant flush to stdout for Shiper) ----
function log(message, data = null) {
  const line =
    `[${new Date().toISOString()}] ${message}` +
    (data ? " " + JSON.stringify(data) : "");
  process.stdout.write(line + "\n");
}

// ---- HEALTH ----
app.get("/health", (req, res) => {
  log("🩺 Health check hit!");
  res.status(200).json({
    status: "ok",
    uptime: Math.round(process.uptime()) + "s",
    version: VERSION,
    environment: NODE_ENV
  });
});

// ---- REWRITE ----
app.post("/api/rewrite", (req, res) => {
  log("✏️ Rewrite endpoint hit!");
  const text = req.body?.text || "";
  const rewritten = text.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim();
  res.json({ success: true, rewritten });
});

// ---- PODCAST ----
app.post("/api/podcast", (req, res) => {
  const script = req.body?.script || "";
  const voice = req.body?.voice || "default";
  log("🎙️ Podcast endpoint hit!", { chars: script.length, voice });
  res.json({
    success: true,
    message: "Podcast request received",
    chars: script.length,
    voice
  });
});

// ---- START ----
app.listen(PORT, () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
});

// ---- OPTIONAL HEARTBEAT LOG (every 5 min to show life in Shiper) ----
setInterval(() => {
  log(`⏱️ Heartbeat: uptime ${Math.round(process.uptime())}s`);
}, 5 * 60 * 1000);
