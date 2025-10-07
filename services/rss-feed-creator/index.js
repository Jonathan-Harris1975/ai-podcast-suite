// services/rss-feed-creator/index.js
import express from "express";
import cors from "cors";
import { log } from "../../utils/logger.js";
import routes from "./routes/index.js";

const app = express();
app.use(cors());
app.use(express.json());

// Mount internal RSS routes
app.use("/", routes);

log.info("✅ rss-feed-creator env OK");

// ✅ Export app (no .listen() call)
export default app;
