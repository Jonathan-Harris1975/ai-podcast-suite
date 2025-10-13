export function log(message, meta = null, level = "info") {
  try {
    const entry = { time: new Date().toISOString(), level, message, ...(meta ? { meta } : {}) };
    process.stdout.write(JSON.stringify(entry) + "\n");
  } catch {
    try { console.log(message); } catch {}
  }
}
