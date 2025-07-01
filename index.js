import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import http from "http";
import compression from "compression";
import dotenv from "dotenv";
import config from "./config/config.js";
import connectDB from "./config/db.config.js";
import errorHandler from "./middleware/error-handler.middleware.js";
import router from "./router.js";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);

app.disable("x-powered-by");

connectDB();

app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    exposedHeaders: [
      "Content-Range",
      "Accept-Ranges",
      "Content-Length",
      "Content-Type",
    ],
  })
);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "✅ Health Compass API is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date(),
  });
});

app.use("/api/data", router.dataRoute);
app.use("/api/bot", router.botRoute);

app.use(errorHandler);

server.listen(config.port, () => {
  console.log(`🚀 Server running at http://localhost:${config.port}`);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});
