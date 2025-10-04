// routes/startProcess.js
import express from "express";
import { log } from "../utils/logger.js";
import { exec } from "child_process";

const router = express.Router();

// POST /start/:sessionId
router.post("/start/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  log.info(`🚀 Starting AI Podcast pipeline for session: ${sessionId}`);

  // Respond immediately so Make.com doesn’t time out
  res.status(200).json({ ok: true, sessionId });

  // Kick off the asynchronous process chain
  try {
    // Script generator
    await runStep("script", sessionId);

    // Artwork
    await runStep("artwork", sessionId);

    // TTS
    await runStep("tts", sessionId);

    log.info(`✅ All services completed successfully for ${sessionId}`);
  } catch (err) {
    log.error({ err }, `❌ Error running pipeline for ${sessionId}`);
  }
});

async function runStep(service, sessionId) {
  return new Promise((resolve, reject) => {
    const cmd = `curl -X POST http://localhost:3000/${service}/start/${sessionId}`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        log.error({ service, error }, `❌ ${service} step failed`);
        return reject(error);
      }
      log.info({ service }, `✅ ${service} step done`);
      resolve();
    });
  });
}

export default startRouter=router;
