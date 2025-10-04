// index.js
import express from 'express';
import dotenv from 'dotenv';

// Routers
import healthRouter from './routes/health.js';
import introRouter from './routes/intro.js';
import mainRouter from './routes/main.js';
import outroRouter from './routes/outro.js';
import composeRouter from './routes/compose.js';
import createScriptRouter from './routes/createScript.js';

dotenv.config();

const app = express();
app.use(express.json());

// Mount routes
app.use('/health', healthRouter);
app.use('/intro', introRouter);
app.use('/main', mainRouter);
app.use('/outro', outroRouter);
app.use('/compose', composeRouter);
app.use('/create-script', createScriptRouter);

// Root
app.get('/', (_req, res) => res.json({ status: 'ok', service: 'Podcast Script Generation API' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
