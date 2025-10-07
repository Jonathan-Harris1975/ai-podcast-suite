// services/rss-feed-creator/index.js
import express from "express";
import cors from "cors";
import { log } from "../../utils/logger.js";
import routes from "./routes/index.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", routes);

log.info("✅ rss-feed-creator env OK");

export default app;
