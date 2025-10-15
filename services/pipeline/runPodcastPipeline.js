// services/pipeline/runPodcastPipeline.js
import { info, error } from "../shared/utils/logger.js";
import { runScriptGenerator } from "../script/generate-script.js";
import { runArtworkService } from "../artwork/create-art.js";
import { runTtsService } from "../tts/run-tts.js";
import { runMergeService } from "../merge/merge-audio.js";

export async function runPodcastPipeline() {
  const startTime = new Date().toISOString();
  info("pipeline.start", { time: startTime });

  try {
    // 1️⃣ Script + Transcript
    const script = await runScriptGenerator();
    info("pipeline.script.done", {
      sessionId: script.sessionId,
      transcript: !!script.transcript,
    });

    // 2️⃣ Artwork
    const art = await runArtworkService(script);
    info("pipeline.artwork.done", { artUrl: art.url });

    // 3️⃣ TTS (Raw chunks + metadata)
    const audio = await runTtsService(script);
    info("pipeline.tts.done", {
      chunkCount: audio.count,
      rawChunksSaved: audio.savedToRaw,
      chunksJson: audio.jsonKey,
    });

    // 4️⃣ Merge final MP3
    const merged = await runMergeService(audio);
    info("pipeline.merge.done", { podcastUrl: merged.url });

    const endTime = new Date().toISOString();
    info("pipeline.completed", {
      success: true,
      startTime,
      endTime,
      sessionId: script.sessionId,
    });

    return {
      ok: true,
      script,
      art,
      audio,
      merged,
      sessionId: script.sessionId,
      timestamp: endTime,
    };
  } catch (err) {
    error("pipeline.failed", { error: err.message });
    throw err;
  }
}
