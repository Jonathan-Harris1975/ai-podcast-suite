import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import healthRouter from "./routes/health.js";
import introRouter from "./routes/intro.js";
import mainRouter from "./routes/main.js";
import outroRouter from "./routes/outro.js";
import composeRouter from "./routes/compose.js";
import createScriptRouter from "./routes/createScript.js";

dotenv.config();
const app = express();
app.use(bodyParser.json());

app.use("/health", healthRouter);
app.use("/intro", introRouter);
app.use("/main", mainRouter);
app.use("/outro", outroRouter);
app.use("/compose", composeRouter);
app.use("/create-script", createScriptRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
