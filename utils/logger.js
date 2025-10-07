// utils/logger.js
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const COLORS = { error: "\x1b[31m", warn: "\x1b[33m", info: "\x1b[32m", debug: "\x1b[35m", reset: "\x1b[0m" };
const envLevel = (process.env.LOG_LEVEL || "info").toLowerCase();
const currentLevel = LEVELS[envLevel] ?? LEVELS.info;
const ts = () => new Date().toISOString();
const fmt = (level, msg) => `${COLORS[level] || ""}[${ts()}] ${level.toUpperCase()}:${COLORS.reset} ${msg}`;
export const log = {
  error: (msg, ...rest) => { if (LEVELS.error <= currentLevel) console.error(fmt("error", msg), ...rest); },
  warn:  (msg, ...rest) => { if (LEVELS.warn  <= currentLevel) console.warn(fmt("warn", msg),  ...rest); },
  info:  (msg, ...rest) => { if (LEVELS.info  <= currentLevel) console.log (fmt("info", msg),  ...rest); },
  debug: (msg, ...rest) => { if (LEVELS.debug <= currentLevel) console.log (fmt("debug", msg), ...rest); },
};
