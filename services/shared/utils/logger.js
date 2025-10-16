// ============================================================
// 🧠 AI Podcast Suite — Pino Logger (Shiper-safe)
// ============================================================

import pino from "pino";

const isProd = process.env.NODE_ENV === "production" || process.env.SHIPER === "true";

export const log = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
            singleLine: true,
          },
        },
      }),
});

export const info = (...args) => log.info(...args);
export const warn = (...args) => log.warn(...args);
export const error = (...args) => log.error(...args);
export const debug = (...args) => log.debug(...args);

export default log;
