// services/podcast/runPodcastPipeline.js
// Uses tts/utils/orchestrator.js for full audio generation and merge flow

import { info, error } from "../shared/utils/logger.js";
import { generateScript } from "../script/generateScript.js";
import { runTTSOrchestrator } from "../tts/utils/orchestrator.js";
import { createPodcastArtwork } from "../artwork/createPodcastArtwork.js";
import { putJson } from "../shared/utils/r2-client.js";

const META_BUCKET = process.env.R2_BUCKET_META;

export async function runPodcastPipeline(sessionId) {
  const started = Date.now();
  const log = (stage, meta) => info(`podcast.${stage}`, { sessionId, ...meta });

  try {
    log("start", {});

    // ── 1️⃣ SCRIPT
    log("script.start", {});
    const scriptResult = await generateScript(sessionId);
    log("script.done", { chunks: scriptResult?.chunks?.length || 0 });

    // ── 2️⃣ TTS + MERGE handled inside orchestrator
    log("tts.orchestrator.start", {});
    const audioResult = await runTTSOrchestrator({
      sessionId,
      textChunks: scriptResult.chunks,
      voice: "en-GB-Wavenet-D",
    });
    log("tts.orchestrator.done", {
      mergedUrl: audioResult.publicUrl,
      total: audioResult.totalChunks,
    });

    // ── 3️⃣ ARTWORK
    log("artwork.start", {});
    const artworkResult = await createPodcastArtwork({ sessionId });
    log("artwork.done", { imageKey: artworkResult.key });

    // ── 4️⃣ META SAVE
    const duration = Math.round((Date.now() - started) / 1000);
    const meta = {
      sessionId,
      createdAt: new Date().toISOString(),
      duration,
      mergedUrl: audioResult.publicUrl,
      artwork: artworkResult.publicUrl,
      totalChunks: audioResult.totalChunks,
      scriptChunks: scriptResult.chunks?.length,
    };

    await putJson(META_BUCKET, `${sessionId}/meta.json`, meta);
    log("meta.saved", { bucket: META_BUCKET });
    log("done", { duration });

    return { ok: true, sessionId, meta };
  } catch (err) {
    error("pipeline.fail", { sessionId, error: err.message });
    return { ok: false, error: err.message };
  }
}
