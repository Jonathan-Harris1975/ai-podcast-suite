// /utils/logger.js
// Simple JSON logger (used across AI Podcast Suite)
import process from "node:process";

export const log = {
  info: (message, meta = {}) => out(message, meta),
  debug: (message, meta = {}) => out(message, meta),
  warn: (message, meta = {}) => out(message, meta),
  error: (message, meta = {}) => out(message, meta)
};

function out(message, meta = {}) {
  const entry = {
    time: new Date().toISOString(),
    message,
    ...(Object.keys(meta).length ? { meta } : {})
  };
  process.stdout.write(JSON.stringify(entry) + "\n");
}
