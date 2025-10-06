AI Podcast Suite – Google TTS Credentials Setup (Shiper)
=========================================================

1️⃣ FILES INCLUDED
- services/tts/loadGoogleCreds.js
- services/tts/index.js (already patched)
- GOOGLE_CREDENTIALS_JSON.txt (minified JSON for Shiper variable)
- This README-TTS-GOOGLE.txt

2️⃣ WHAT THIS DOES
The new helper automatically writes your Google service account JSON from
the environment variable into a temporary file inside the container:
    /tmp/google_creds.json

This file path is exported to GOOGLE_APPLICATION_CREDENTIALS so that
Google Text-to-Speech authenticates normally.

3️⃣ ENVIRONMENT VARIABLES TO SET IN SHIPER
In your Shiper dashboard → Variables:

   NODE_ENV = production
   PORT = 8080
   GOOGLE_CREDENTIALS_JSON = <paste contents of GOOGLE_CREDENTIALS_JSON.txt>

4️⃣ HOW TO GET THE ONE-LINE JSON
If you ever regenerate credentials:
   cat turingpodcasttts-e58851648e74.json | jq -c > GOOGLE_CREDENTIALS_JSON.txt

5️⃣ REDEPLOY
After saving the variables, redeploy your app on Shiper.

On startup you should see:
   ✅ Google credentials written to /tmp/google_creds.json
   🔊 Google TTS client initialized successfully
   🚀 AI Podcast Suite Unified Server Started
