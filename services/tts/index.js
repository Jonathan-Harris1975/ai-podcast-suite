// services/tts/index.js
// TTS entrypoint using centralized R2 + logger; plain Gemini (no SSML)

import { info, error } from "../shared/utils/logger.js";
import { synthesizeSpeech } from "./utils/tts-engine.js";
import { saveTtsChunk, saveMergedTts, saveTtsMeta, publishFinalTts } from "./utils/io.js";

/**
 * Generate and store TTS (chunked, merged, and published)
 * @param {object} opts
 * @param {string} opts.text
 * @param {string} opts.sessionId
 * @param {string} opts.series
 * @param {string} opts.voice
 */
export async function processTtsSession({ text, sessionId, series, voice = "en-GB-Wavenet-D" }) {
  info("tts.session.start", { sessionId, series, textLength: text.length });

  try {
    // Step 1 – Generate raw audio
    const audioBuffer = await synthesizeSpeech({ text, voice });
    if (!audioBuffer?.length) throw new Error("Empty TTS output");

    const chunkKey = `chunks/${sessionId}/main.mp3`;
    await saveTtsChunk(audioBuffer, chunkKey);

    // Step 2 – Save merged (same as chunk for now)
    const mergedKey = `episodes/${sessionId}/merged.mp3`;
    await saveMergedTts(audioBuffer, mergedKey);

    // Step 3 – Store metadata
    const metaKey = `episodes/${sessionId}/meta.json`;
    await saveTtsMeta(metaKey, { series, voice, textLength: text.length });

    // Step 4 – Publish final copy to public bucket
    const publicKey = `episodes/${sessionId}/final.mp3`;
    const url = await publishFinalTts(audioBuffer, publicKey);

    info("tts.session.complete", { sessionId, url });
    return { url, sessionId };
  } catch (err) {
    error("tts.session.fail", { sessionId, error: err.message });
    throw err;
  }
}
