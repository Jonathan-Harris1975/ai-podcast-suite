
// utils/retry.js
import { log } from "./logger.js";

export async function withRetry(fn, { retries = 3, delay = 1000, label = "task" } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      log.warn({ attempt, err }, `⚠️ ${label} attempt ${attempt} failed`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  log.error({ err: lastError }, `❌ ${label} failed after ${retries} attempts`);
  throw lastError;
}
