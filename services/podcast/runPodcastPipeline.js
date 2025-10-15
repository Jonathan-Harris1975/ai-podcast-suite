// services/podcast/runPodcastPipeline.js
// AI Podcast Suite – Full Orchestrated Podcast Pipeline
// Runs script (intro→main→outro→compose), TTS, artwork, and metadata save.

import { info, error } from "#shared/logger.js";
import { runScriptOrchestrator } from "../script/utils/orchestrator.js";
import { processPodcastPipeline } from "../tts/utils/orchestrator.js";
import { createPodcastArtwork } from "../artwork/createPodcastArtwork.js";
import { putJson } from "#shared/r2-client.js";

const META_BUCKET = process.env.R2_BUCKET_META;

export async function runPodcastPipeline(sessionId) {
  const started = Date.now();
  const log = (stage, meta) => info(`podcast.${stage}`, { sessionId, ...meta });

  try {
    log("start", {});

    // ── 1️⃣ SCRIPT GENERATION
    log("script.start", {});
    const scriptResult = await runScriptOrchestrator(sessionId);
    if (!scriptResult?.ok || !scriptResult?.chunks?.length) {
      throw new Error("Script generation failed or returned no chunks");
    }
    log("script.done", { chunks: scriptResult.chunks.length });

    // ── 2️⃣ TEXT-TO-SPEECH + MERGE
    log("tts.orchestrator.start", {});
    const audioResult = await processPodcastPipeline({
      sessionId,
      textChunks: scriptResult.chunks,
      voice: "en-GB-Wavenet-D", // your preferred voice
    });
    if (!audioResult?.publicUrl) {
      throw new Error("TTS orchestrator did not return merged URL");
    }
    log("tts.orchestrator.done", {
      mergedUrl: audioResult.publicUrl,
      total: audioResult.totalChunks,
    });

    // ── 3️⃣ ARTWORK GENERATION
    log("artwork.start", {});
    const artworkResult = await createPodcastArtwork({ sessionId });
    if (!artworkResult?.publicUrl) {
      throw new Error("Artwork generation failed");
    }
    log("artwork.done", { imageKey: artworkResult.key });

    // ── 4️⃣ METADATA SAVE TO R2
    const duration = Math.round((Date.now() - started) / 1000);
    const meta = {
      sessionId,
      createdAt: new Date().toISOString(),
      duration,
      mergedUrl: audioResult.publicUrl,
      artwork: artworkResult.publicUrl,
      totalChunks: audioResult.totalChunks,
      scriptChunks: scriptResult.chunks.length,
    };

    await putJson(META_BUCKET, `${sessionId}/meta.json`, meta);
    log("meta.saved", { bucket: META_BUCKET, key: `${sessionId}/meta.json` });

    // ── ✅ PIPELINE COMPLETE
    log("done", { duration, mergedUrl: audioResult.publicUrl });
    return { ok: true, sessionId, meta };
  } catch (err) {
    error("pipeline.fail", { sessionId, error: err.message });
    return { ok: false, error: err.message };
  }
      }
