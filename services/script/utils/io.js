// services/script/utils/io.js
import path from "node:path";
import { putText, putJson } from "#shared/r2-client.js";
import { info } from "#shared/logger.js";

const RAW_TEXT_BUCKET       = process.env.R2_BUCKET_RAW_TEXT;      // raw-text
const CHUNKS_BUCKET         = process.env.R2_BUCKET_CHUNKS;        // podcast-chunks
const TRANSCRIPTS_BUCKET    = process.env.R2_BUCKET_TRANSCRIPTS;   // transcripts
const META_BUCKET           = process.env.R2_BUCKET_META;          // podcast-meta

function keyForRaw({ episodeId }) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${episodeId}/raw/${ts}.txt`;
}

function keyForChunk({ episodeId, index }) {
  return `${episodeId}/chunks/${String(index).padStart(3, "0")}.md`;
}

function keyForTranscript({ episodeId }) {
  return `${episodeId}/transcript/${episodeId}.md`;
}

function keyForMeta({ episodeId }) {
  return `${episodeId}/meta.json`;
}

export async function writeRawText({ episodeId, text }) {
  const key = keyForRaw({ episodeId });
  await putText(RAW_TEXT_BUCKET, key, text || "");
  info("script.io.raw.put", { bucket: RAW_TEXT_BUCKET, key });
  return `r2://${RAW_TEXT_BUCKET}/${key}`;
}

export async function writeChunk({ episodeId, index, text }) {
  const key = keyForChunk({ episodeId, index });
  await putText(CHUNKS_BUCKET, key, text || "");
  info("script.io.chunk.put", { bucket: CHUNKS_BUCKET, key });
  return `r2://${CHUNKS_BUCKET}/${key}`;
}

export async function writeTranscript({ episodeId, text }) {
  const key = keyForTranscript({ episodeId });
  await putText(TRANSCRIPTS_BUCKET, key, text || "");
  info("script.io.transcript.put", { bucket: TRANSCRIPTS_BUCKET, key });
  return `r2://${TRANSCRIPTS_BUCKET}/${key}`;
}

export async function writeMeta({ episodeId, meta }) {
  const key = keyForMeta({ episodeId });
  await putJson(META_BUCKET, key, meta || {});
  info("script.io.meta.put", { bucket: META_BUCKET, key });
  return `r2://${META_BUCKET}/${key}`;
}
