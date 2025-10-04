import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import fetch from 'node-fetch';
import { log } from './utils/logger.js';

// Import service routers (absolute paths within monorepo)
import artworkCreate from './services/artwork/routes/createArtwork.js';
import artworkGenerate from './services/artwork/routes/generateArtwork.js';
import artworkHealth from './services/artwork/routes/health.js';

import scriptIntro from './services/script/routes/intro.js';
import scriptMain from './services/script/routes/main.js';
import scriptOutro from './services/script/routes/outro.js';
import scriptCompose from './services/script/routes/compose.js';
import scriptCreate from './services/script/routes/createScript.js';
import scriptHealth from './services/script/routes/health.js';

import ttsHealth from './services/tts/routes/health.js';
import ttsPodcast from './services/tts/routes/podcast.js';
import ttsMerge from './services/tts/routes/merge.js';
import ttsTts from './services/tts/routes/tts.js';
import ttsEdit from './services/tts/routes/edit.js';

const app = express();

// raw body for webhook verification (if needed later)
app.use((req, res, next) => {
  let data = [];
  req.on('data', (chunk) => data.push(chunk));
  req.on('end', () => {
    req.rawBody = Buffer.concat(data);
    next();
  });
});

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(pinoHttp({ logger: log }));

// Mount services under namespaces; routers are pathless so we set base paths
app.use('/artwork/health', artworkHealth);
app.use('/artwork/create', artworkCreate);
app.use('/artwork/generate', artworkGenerate);

app.use('/script/health', scriptHealth);
app.use('/script/intro', scriptIntro);
app.use('/script/main', scriptMain);
app.use('/script/outro', scriptOutro);
app.use('/script/compose', scriptCompose);
app.use('/script/create-script', scriptCreate);

app.use('/tts/health', ttsHealth);
app.use('/tts/podcast', ttsPodcast);
app.use('/tts/merge', ttsMerge);
app.use('/tts/tts', ttsTts);
app.use('/tts/edit', ttsEdit);

// unified health
app.get('/health', async (req, res) => {
  res.json({
    ok: true,
    services: {
      artwork: 'mounted',
      script: 'mounted',
      tts: 'mounted'
    },
    time: new Date().toISOString()
  });
});

// Orchestrated start
// GET /start?sessionId=...  (minimal orchestration stub)
app.post('/start', async (req, res) => {
  const sessionId = req.query.sessionId || req.body.sessionId;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  // In this monoprocess setup the routes are mounted; we just respond
  // Actual chaining stays in your Make.com flow as discussed
  return res.json({ ok: true, sessionId, message: 'Services mounted; trigger individual steps via existing webhooks.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log.info({ port: PORT }, '🧩 AI Podcast Suite running');
});
