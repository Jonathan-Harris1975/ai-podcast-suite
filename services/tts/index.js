import express from "express";
import cors from "cors";
import { log } from "./utils/logger.js";
import ttsRouter from "./routes/tts.js";
import mergeRouter from "./routes/merge.js";
import editRouter from "./routes/edit.js";
import podcastRouter from "./routes/podcast.js";
import { postWebhook } from "./utils/webhooks.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => res.status(200).send("ok"));

// POST /health will kick off the TTS step using env TTS_WEBHOOK
app.post("/health", async (req, res) => {
  const sessionId = (req.body && req.body.sessionId) || `TT-${new Date().toISOString().slice(0,10)}`;
  log.info({ sessionId }, "🔔 Health POST");
  const r = await postWebhook("TTS_WEBHOOK", { sessionId });
  res.json({ ok: true, sessionId, webhook: r });
});

app.use("/api/tts", ttsRouter);
app.use("/start-tts", ttsRouter); // alias
app.use("/api/merge", mergeRouter);
app.use("/api/edit", editRouter);
app.use("/api/podcast", podcastRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log.info("🚀 TTS service running on port " + PORT);
  console.log("🚀 TTS service running on port " + PORT);
  console.log("📊 GET  /health           → ok");
  console.log("🧩 POST /api/tts          → start TTS (sequential)");
  console.log("🧩 POST /start-tts        → alias for TTS start");
  console.log("✅ POST /api/merge        → merge chunks (sequential)");
  console.log("🎛  POST /api/edit        → normalize/fade + upload + meta (sequential)");
  console.log("📣 POST /api/podcast      → final ack");
});
