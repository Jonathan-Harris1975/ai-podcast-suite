// services/bootstrap.js
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { log } from "../utils/logger.js";
import {getObject, putText, putJson} from "./rss-feed-creator/utils/r2-client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sha = (s) => crypto.createHash("sha256").update(s||"", "utf8").digest("hex").slice(0,12);

const DATA_DIRS = [
  path.resolve(__dirname, "../rss-feed-creator/data"),
  path.resolve(process.cwd(), "services/rss-feed-creator/data"),
  path.resolve(process.cwd(), "ai-podcast-suite-main/services/rss-feed-creator/data"),
  "/app/services/rss-feed-creator/data",
  "/app/ai-podcast-suite-main/services/rss-feed-creator/data",
];

function findDataDir(){
  for(const d of DATA_DIRS){
    try { if (fs.existsSync(d) && fs.statSync(d).isDirectory()) return d; } catch {}
  }
  return null;
}

function readLocal(dir, name){
  const fp = path.join(dir, name);
  if(!fs.existsSync(fp)){ log.error(`❌ Local data file missing: ${fp}`); return {ok:false, content:""};}
  const c = fs.readFileSync(fp, "utf-8");
  if(!c.trim()){ log.error(`❌ Local data file is empty: ${fp}`); return {ok:false, content:""};}
  log.info(`📖 Loaded ${name} (${Buffer.byteLength(c,"utf8")} bytes, sha=${sha(c)}) from ${fp}`);
  return {ok:true, content:c};
}

export async function bootstrapR2(){
  log.info("🧩 Running R2 bootstrap...");
  const dataDir = findDataDir();
  if(!dataDir){ log.error("❌ Could not locate local data directory"); return; }
  log.info(`📂 Using data directory: ${dataDir}`);

  const feedsLocal = readLocal(dataDir, "feeds.txt");
  const urlsLocal  = readLocal(dataDir, "urls.txt");
  if(!feedsLocal.ok || !urlsLocal.ok){
    log.error("❌ Aborting bootstrap — will not upload blank/missing files.");
    return;
  }

  async function get(key){
    try{ return await getObject(key); }catch(e){ log.error(`❌ getObject(${key}) failed: ${e.message}`); return null; }
  }

  async function ensureOrSync(key, localContent){
    const existing = await get(key);
    if(!existing || !existing.trim()){
      await putText(key, localContent);
      log.info(`✅ Uploaded ${key} (${Buffer.byteLength(localContent,"utf8")} bytes, sha=${sha(localContent)})`);
      return;
    }
    if(sha(existing) !== sha(localContent)){
      await putText(key, localContent);
      log.info(`🔄 Synced ${key} in R2 to latest local version (sha ${sha(localContent)})`);
    }else{
      log.info(`ℹ️ ${key} already up to date in R2 (sha ${sha(existing)})`);
    }
  }

  async function ensureCursor(){
    const existing = await get("cursor.json");
    if(existing && existing.trim() !== "{}"){ log.info("ℹ️ cursor.json already present"); return; }
    const data = { lastUpdated: new Date().toISOString(), processed: [] };
    await putJson("cursor.json", data);
    log.info("✅ Seeded cursor.json");
  }

  await ensureOrSync("feeds.txt", feedsLocal.content);
  await ensureOrSync("urls.txt",  urlsLocal.content);
  await ensureCursor();
  log.info("✅ R2 bootstrap completed");
}
