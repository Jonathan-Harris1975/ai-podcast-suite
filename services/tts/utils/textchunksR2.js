import { R2_BUCKETS, listKeys, buildPublicUrl } from "./r2-client.js";
import { log } from "./logger.js";

export async function getTextChunkUrls(sessionId) {
  const prefix = `${sessionId}/`;
  const keys = await listKeys({ bucket: R2_BUCKETS.RAW_TEXT, prefix });
  const chunkKeys = keys
    .filter(k => /chunk-\d+\.txt$/.test(k))
    .sort((a,b) => {
      const ai = parseInt(a.match(/chunk-(\d+)\.txt$/)[1],10);
      const bi = parseInt(b.match(/chunk-(\d+)\.txt$/)[1],10);
      return ai - bi;
    });
  const urls = chunkKeys.map(k => buildPublicUrl(BUCKETS.RAW_TEXT, k)).filter(Boolean);
  log.info({ sessionId, count: urls.length }, "🧾 text chunk URLs");
  return urls;
}
