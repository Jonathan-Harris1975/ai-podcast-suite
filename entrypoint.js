// entrypoint.js
import express from "express";
import mainApp from "./server.js";
import rssApp from "./services/rss-feed-creator/index.js";

const app = express();

app.get("/", (_, res) => res.send("AI Podcast Suite Online"));
app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/", mainApp);
app.use("/rss", rssApp);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("===========================================");
  console.log("🚀 AI Podcast Suite Unified Server Started");
  console.log("🧠 Main Service mounted at: /");
  console.log("📰 RSS Feed Creator mounted at: /rss");
  console.log(`✅ Listening on port: ${PORT}`);
  console.log("===========================================");
});
