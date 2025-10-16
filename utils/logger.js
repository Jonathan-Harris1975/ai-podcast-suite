// ============================================================
// 🧠 AI Podcast Suite — Final Unified Logger (Pino)
// ============================================================
//
// - Works in both production (JSON logs) and local dev (pretty logs)
// - Prevents redeclaration errors by using a single export symbol
// - No global collisions or duplicate imports
// ============================================================

import pino from "pino";

const isProd =
  process.env.NODE_ENV === "production" || process.env.SHIPER === "true";

// Singleton check to prevent multiple reinitializations
let loggerInstance = globalThis.__AI_PODCAST_LOGGER__;
if (!loggerInstance) {
  if (isProd) {
    loggerInstance = pino({
      level: process.env.LOG_LEVEL || "info",
      base: { service: "ai-podcast-suite" },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  } else {
    loggerInstance = pino({
      level: process.env.LOG_LEVEL || "debug",
      base: { service: "ai-podcast-suite" },
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      },
    });
  }

  // store in global namespace to prevent re-creation
  globalThis.__AI_PODCAST_LOGGER__ = loggerInstance;
}

// ✅ Export consistent singleton
export const log = loggerInstance;

// Optional helper shortcuts
export const info = (...args) => log.info(...args);
export const warn = (...args) => log.warn(...args);
export const error = (...args) => log.error(...args);
export const debug = (...args) => log.debug(...args);

export default log;
