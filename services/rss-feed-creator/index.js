// RSS Feed Creator — entry point
import { generateAndUploadFeed } from "./utils/feedGenerator.js";
import { ensureBootstrapFiles } from "./utils/bootstrap.js";

function jlog(message, meta = undefined) {
  const line = { time: new Date().toISOString(), message };
  if (meta && typeof meta === "object") line.meta = meta;
  process.stdout.write(JSON.stringify(line) + "\n");
}

export async function startRssGeneration() {
  jlog("🟢 rss:start", { triggeredBy: "api" });
  try {
    await ensureBootstrapFiles();
    const res = await generateAndUploadFeed();
    jlog("✅ rss:complete", { items: res?.items || 0, wrote: res?.wrote || [] });
  } catch (e) {
    jlog("❌ rss:error", { error: e?.message });
  }
}

export default startRssGeneration;
