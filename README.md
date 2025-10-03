
# AI Podcast Suite (Monorepo)

This bundles three existing **working** services without changing their behavior:
- **Artwork** (under `services/artwork`)
- **Script Maker** (under `services/script`)
- **TTS / MP3** (under `services/tts`)

A thin orchestration server mounts each service's existing routes under namespaces, so you can run everything in a single container.

## Endpoints

- `GET /health` — returns mounted services.
- **Artwork:** `/artwork/health`, `/artwork/create`, `/artwork/generate`
- **Script:** `/script/health`, `/script/intro`, `/script/main`, `/script/outro`, `/script/compose`, `/script/create-script`
- **TTS:** `/tts/health`, `/tts/podcast`, `/tts/merge`, `/tts/tts`, `/tts/edit`

> All existing route handlers from each repo are mounted as-is. No functional changes were made.

## Run

```bash
npm install
npm start
```

## Deploy

Use the provided `Dockerfile`.

```
docker build -t ai-podcast-suite .
docker run -p 3000:3000 --env-file .env ai-podcast-suite
```

Set your existing environment variables exactly as before; this server does not rename any variables.
