// services/shared/utils/logger.js
// Minimal JSON logger (Render/Shiper friendly)
export function log(level, message, meta = null) {
  try {
    const entry = {
      time: new Date().toISOString(),
      level,
      message,
      ...(meta && typeof meta === "object" ? { meta } : {}),
    };
    process.stdout.write(JSON.stringify(entry) + "\n");
  } catch {
    process.stdout.write(JSON.stringify({ time: new Date().toISOString(), level, message }) + "\n");
  }
}

export const info  = (msg, meta) => log("info", msg, meta);
export const warn  = (msg, meta) => log("warn", msg, meta);
export const error = (msg, meta) => log("error", msg, meta);