// services/tts/index.js
// TTS service — wired to central R2 + logger (Gemini-only, MP3, no SSML)

import path from "node:path";
import { putBuffer, putJson, getObject } from "../shared/utils/r2-client.js";
import { info, warn, error } from "../shared/utils/logger.js";

// Keep your existing Gemini client / synthesis imports & logic intact.
// (Whatever you already use to call Gemini stays the same.)
// Example placeholder import (leave your current one if different):
// import { synthesizeWithGemini } from "./provider-gemini.js";

// ──────────────────────────────────────────────────────────────────────────────
// Buckets (centralised)
// ──────────────────────────────────────────────────────────────────────────────
const BUCKET_META   = process.env.R2_BUCKET_META;         // podcast-meta
const BUCKET_RAW    = process.env.R2_BUCKET_RAW;          // podcast-chunks   (raw MP3 chunks)
const BUCKET_POD    = process.env.R2_BUCKET_PODCAST;      // podcast          (final episode mp3 if produced here)
const BUCKET_MERGED = process.env.R2_BUCKET_MERGED;       // podcast-merged   (post-merge audio if applicable)

function reqEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}
function assertBuckets() {
  reqEnv("R2_BUCKET_META");
  reqEnv("R2_BUCKET_RAW");
  reqEnv("R2_BUCKET_PODCAST");
  reqEnv("R2_BUCKET_MERGED");
}

// ──────────────────────────────────────────────────────────────────────────────
// Core API (called by your script pipeline)
// textChunks: [{ id, text, seq }, ...]
// voiceConfig: { voice, speed?, pitch? }  — whatever your code already supports
// sessionId: stable id for this run (used in object keys)
// ──────────────────────────────────────────────────────────────────────────────
export async function renderChunksToMp3({ sessionId, textChunks, voiceConfig }) {
  assertBuckets();

  if (!sessionId || !Array.isArray(textChunks) || textChunks.length === 0) {
    throw new Error("renderChunksToMp3: invalid args (sessionId/textChunks)");
  }

  info("tts.start", { sessionId, total: textChunks.length });

  const results = [];
  let ok = 0, fail = 0;

  for (const chunk of textChunks) {
    const id = chunk.id || `ck_${String(chunk.seq ?? results.length + 1).padStart(3, "0")}`;
    const key = `${sessionId}/${id}.mp3`;

    try {
      // ⬇️ Keep your existing Gemini synthesis function here.
      // It must return a Buffer or Uint8Array of MP3 audio.
      //
      // const audioBuffer = await synthesizeWithGemini(chunk.text, voiceConfig);
      //
      // DO NOT change your working synthesis — just ensure it returns MP3 bytes.

      const audioBuffer = await synthesizeWithGemini(chunk.text, voiceConfig); // ← your existing call

      if (!audioBuffer || !audioBuffer.byteLength) {
        throw new Error("Empty audio buffer from provider");
      }

      await putBuffer(BUCKET_RAW, key, audioBuffer, {
        contentType: "audio/mpeg",
        cacheControl: "public, max-age=31536000, immutable"
      });

      results.push({ id, key, bucket: BUCKET_RAW, bytes: audioBuffer.byteLength });
      ok++;
      info("tts.chunk.ok", { sessionId, id, key, bytes: audioBuffer.byteLength });
    } catch (e) {
      fail++;
      error("tts.chunk.fail", { sessionId, id, err: e.message });
      results.push({ id, error: e.message });
    }
  }

  // Save a simple manifest for downstream merge/compose steps
  const manifestKey = `${sessionId}/tts-manifest.json`;
  await putJson(BUCKET_META, manifestKey, {
    sessionId,
    at: new Date().toISOString(),
    ok,
    fail,
    total: results.length,
    chunks: results
  });

  info("tts.done", { sessionId, ok, fail, manifest: `${BUCKET_META}/${manifestKey}` });
  return { ok, fail, total: results.length, manifestKey, chunks: results };
}

// Optional: load transcript helper if your script step expects it
export async function getTranscript(sessionId) {
  assertBuckets();
  // If your pipeline writes transcript to META or TRANSCRIPTS bucket,
  // read it here as your current code expects.
  // Example:
  // const key = `${sessionId}/transcript.json`;
  // const json = await getObject(process.env.R2_BUCKET_TRANSCRIPTS, key);
  // return json ? JSON.parse(json) : null;
  return null; // keep unchanged unless your pipeline requires this call
        }
