// Minimal JSON logger
export const log = {
  info: (msg, meta) => process.stdout.write(JSON.stringify({ time: new Date().toISOString(), message: msg, meta }) + "\n"),
  debug: (msg, meta) => process.stdout.write(JSON.stringify({ time: new Date().toISOString(), message: msg, meta }) + "\n"),
  error: (msg, meta) => process.stdout.write(JSON.stringify({ time: new Date().toISOString(), message: msg, meta }) + "\n"),
};
