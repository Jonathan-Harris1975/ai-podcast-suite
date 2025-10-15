// services/podcast/runPodcastPipeline.js
// Full orchestrator for AI Podcast Suite
// ✅ Imports and paths fixed 2025-10-15

import { info, error } from "../shared/utils/logger.js";
import { generateScript } from "../script/generateScript.js";
import { renderChunksToMp3 } from "../tts/renderChunksToMp3.js";
import { mergeAudioChunks } from "../merge/mergeProcessor.js";
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

    // ── 2️⃣ TTS
    log("tts.start", {});
    const ttsResult = await renderChunksToMp3({
      sessionId,
      textChunks: scriptResult.chunks,
      voiceConfig: { voice: "en-GB-Wavenet-D" },
    });
    log("tts.done", { ok: ttsResult.ok, fail: ttsResult.fail });

    // ── 3️⃣ MERGE
    log("merge.start", {});
    const mergeResult = await mergeAudioChunks({ sessionId, chunks: ttsResult.chunks });
    log("merge.done", { mergedUrl: mergeResult.publicUrl });

    // ── 4️⃣ ARTWORK
    log("artwork.start", {});
    const artworkResult = await createPodcastArtwork({ sessionId });
    log("artwork.done", { imageKey: artworkResult.key });

    // ── 5️⃣ META SAVE
    const duration = Math.round((Date.now() - started) / 1000);
    const meta = {
      sessionId,
      createdAt: new Date().toISOString(),
      duration,
      mergedUrl: mergeResult.publicUrl,
      artwork: artworkResult.publicUrl,
      totalChunks: ttsResult.total,
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
