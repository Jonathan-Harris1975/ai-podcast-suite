// index.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { config } from "dotenv";
import healthRouter from "./routes/health.js";
import createArtworkRouter from "./routes/createArtwork.js";
import generateArtworkRouter from "./routes/generateArtwork.js";

config();

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/health", healthRouter);
app.use("/create-artwork", createArtworkRouter);
app.use("/generate", generateArtworkRouter);

// ✅ Server start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Artwork service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎨 Generate endpoint: http://localhost:${PORT}/generate`);
});
