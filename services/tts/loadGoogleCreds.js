import { s3, R2_BUCKETS, uploadBuffer, listKeys, getObjectAsText } from "../r2-client.js";
// services/tts/loadGoogleCreds.js
import fs from "fs";
import path from "path";

export function loadGoogleCredentials() {
  if (!process.env.GOOGLE_CREDENTIALS_JSON) {
    console.warn("⚠️ GOOGLE_CREDENTIALS_JSON not set; Google APIs will fail if required.");
    return;
  }

  try {
    const credsPath = path.join("/tmp", "google_creds.json");
    fs.writeFileSync(credsPath, process.env.GOOGLE_CREDENTIALS_JSON);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
    console.log("✅ Google credentials written to", credsPath);
  } catch (err) {
    console.error("❌ Failed to write Google credentials file:", err);
  }
}
