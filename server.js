// server.js — absolute minimal route sanity test
import express from "express";
import process from "node:process";
import fs from "node:fs";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";

function log(message, meta = null) {
  const entry = { time: new Date().toISOString(), message, ...(meta ? { meta } : {}) };
  try { process.stdout.write(JSON.stringify(entry) + "\n"); } catch {}
}

// confirm file existence
log("🧩 Preflight check", {
  rewriteExists: fs.existsSync("./routes/rewrite.js"),
});

app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.status(200).json({ status: "ok" });
});

// --- import directly, no async, no env flags ---
import rewriteRouter from "./routes/rewrite.js";
app.use("/api/rewrite", rewriteRouter);
log("✅ Mounted /api/rewrite");

// 404 handler
app.use("*", (req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl });
  res.status(404).json({ error: "Endpoint not found", path: req.originalUrl });
});

app.listen(PORT, () => {
  log("🚀 Server listening", { PORT, NODE_ENV });
});
