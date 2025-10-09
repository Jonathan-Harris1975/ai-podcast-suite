import { s3, R2_BUCKETS, validateR2Once, uploadBuffer, listKeys, getObjectAsText } from "../../r2-client.js";
import { validateEnv } from "../services/env-checker.js";
import { validateR2Once, s3, R2_BUCKETS, uploadBuffer } from "../services/r2-client.js";

validateEnv();          // hard-stop if any env var is missing
await validateR2Once(); // single HeadBucket probe (no retries/ping)
import { log } from "../../../utils/logger.js";

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
