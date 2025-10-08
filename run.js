// run.js
import { runScriptService } from "./services/script/scriptService.js";
import { runArtworkService } from "./services/artwork/artworkService.js";
import { runTTSService } from "./services/tts/ttsService.js";
import { log } from "utils/logger.js";

/**
 * Runs all 3 services sequentially for the given sessionId.
 */
export async function runAllServices(sessionId) {
  try {
    log.info({ sessionId }, "🧠 Starting full pipeline");

    await runScriptService(sessionId);
    await runArtworkService(sessionId);
    await runTTSService(sessionId);

    log.info({ sessionId }, "✅ All services completed successfully");
    return { success: true };
  } catch (err) {
    log.error({ err, sessionId }, "❌ Error in runAllServices");
    return { success: false, error: err.message };
  }
}
