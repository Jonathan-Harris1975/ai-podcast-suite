// ============================================================
// 🧠 AI Podcast Suite — Unified Pino Logger (Shiper-safe)
// ============================================================
//
// - Works in both development and production
// - Pretty prints locally using pino-pretty
// - Emits structured JSON in production for Shiper
// ============================================================

import pino from "pino";

const isProd =
  process.env.NODE_ENV === "production" || process.env.SHIPER === "true";

let loggerInstance;

if (isProd) {
  // ✅ Production: JSON logs for Shiper / Render
  loggerInstance = pino({
    level: process.env.LOG_LEVEL || "info",
    base: { service: "ai-podcast-suite" },
    timestamp: pino.stdTimeFunctions.isoTime
  });
} else {
  // 🧩 Development: Pretty output using pino-pretty
  loggerInstance = pino({
    level: process.env.LOG_LEVEL || "debug",
    base: { service: "ai-podcast-suite" },
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        singleLine: true
      }
    }
  });
}

// ✅ Export single instance (no duplicate declaration issues)
export const log = loggerInstance;

// Optional direct helper aliases (for convenience)
export const info = (...args) => log.info(...args);
export const warn = (...args) => log.warn(...args);
export const error = (...args) => log.error(...args);
export const debug = (...args) => log.debug(...args);

export default log;
