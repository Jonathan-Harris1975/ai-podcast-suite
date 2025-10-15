// /utils/logger.js
// Plain text logger. Emojis first, no colors/styles. Respects LOG_LEVEL.
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const envLevel = (process.env.LOG_LEVEL || "info").toLowerCase();
const CURRENT = LEVELS[envLevel] ?? LEVELS.info;

function fmt(data) {
  try {
    if (data === undefined || data === null) return "";
    if (typeof data === "string") return data;
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

export const log = {
  error: (data, msg = "") => {
    if (CURRENT >= LEVELS.error) console.error("❌ ERROR:", msg, fmt(data));
  },
  warn: (data, msg = "") => {
    if (CURRENT >= LEVELS.warn) console.warn("⚠️ WARN:", msg, fmt(data));
  },
  info: (data, msg = "") => {
    if (CURRENT >= LEVELS.info) console.log("ℹ️ INFO:", msg, fmt(data));
  },
  debug: (data, msg = "") => {
    if (CURRENT >= LEVELS.debug) console.log("🔍 DEBUG:", msg, fmt(data));
  },
};