// ============================================================
// 🧠 AI Podcast Suite — Pino Logger
// ============================================================
// Structured logging with environment-aware settings
// Works consistently in Shiper, Render, and local dev
// ------------------------------------------------------------

import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const log = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
          singleLine: true,
        },
      },
});

// Optional shorthand helpers (to keep existing calls working)
export const info = (...args) => log.info(...args);
export const warn = (...args) => log.warn(...args);
export const error = (...args) => log.error(...args);
export const debug = (...args) => log.debug(...args);

export default log;
