// AI Podcast Suite Server – Shiper Optimized v2025.10.10
import express from "express";
import process from "node:process";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERSION = "2025.10.10";
const NODE_ENV = process.env.NODE_ENV || "production";

function jlog(message, meta = undefined) {
  const line = { time: new Date().toISOString(), message };
  if (meta && typeof meta === "object") line.meta = meta;
  process.stdout.write(JSON.stringify(line) + "\n");
}

async function probeRssModule() {
  try {
    await import("./services/rss-feed-creator/index.js");
    jlog("🔎 RSS module import OK");
  } catch (e) {
    jlog("⚠️ RSS module import failed", { error: e?.message });
  }
}

app.get("/health", (req, res) => {
  jlog("🩺 Health check hit");
  res.status(200).json({
    status: "ok",
    uptime: Math.round(process.uptime()) + "s",
    version: VERSION,
    environment: NODE_ENV,
  });
});

app.post("/api/rewrite", async (req, res) => {
  jlog("✏️ Rewrite triggered", { triggeredBy: "manual" });
  (async () => {
    try {
      const { startRssGeneration } = await import("./services/rss-feed-creator/index.js");
      await startRssGeneration();
    } catch (e) {
      jlog("❌ RSS fire-and-forget failed to dispatch", { error: e?.message });
    }
  })();
  res.json({ success: true, message: "RSS Feed generation started" });
});

app.post("/api/podcast", (req, res) => {
  const script = req.body?.script || "";
  const voice = req.body?.voice || "default";
  jlog("🎙️ Podcast endpoint hit", { chars: script.length, voice });
  res.json({ success: true, message: "Podcast request received", chars: script.length, voice });
});

app.listen(PORT, async () => {
  jlog(`🚀 Server running on port ${PORT} (${NODE_ENV === "production" ? "Production" : NODE_ENV})`);
  await probeRssModule();
});

setInterval(() => {
  jlog(`⏱️ Heartbeat: uptime ${Math.round(process.uptime())}s`);
}, 30 * 60 * 1000);

export default app;
