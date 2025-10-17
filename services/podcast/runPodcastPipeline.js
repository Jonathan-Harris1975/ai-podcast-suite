// ============================================================
// 🧩 AI Podcast Suite — Podcast Pipeline Runner
// ============================================================
//
// Entry point that orchestrates feed parsing, TTS, and upload.
// ============================================================

import { log } from "#shared/logger.js";
import { processPodcastPipeline } from "../tts/utils/orchestrator.js";

export async function runPipeline(payload = {}) {
  try {
    log.info("pipeline.start", { payloadKeys: Object.keys(payload) });

    const result = await processPodcastPipeline(payload.sessionId, payload.text);

    log.info("pipeline.complete", { success: true });
    return result;
  } catch (err) {
    log.error("pipeline.failed", { error: err.message });
    throw err;
  }
}
