import { s3, R2_BUCKETS, validateR2Once, uploadBuffer, listKeys, getObjectAsText } from "../r2-client.js";
// services/tts/index.js
import { loadGoogleCredentials } from "./loadGoogleCreds.js";
loadGoogleCredentials(); // 🔑 writes credentials JSON into /tmp for Google SDK

import textToSpeech from "@google-cloud/text-to-speech";

// Example usage or initialization
const client = new textToSpeech.TextToSpeechClient();
console.log("🔊 Google TTS client initialized successfully");

export default client;
