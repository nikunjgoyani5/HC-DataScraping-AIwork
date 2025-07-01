import express from "express";
import cors from "cors";
import config from "./config/config.js";
import connectDB from "./config/db.config.js";
import morgan from "morgan";
import http from "http";
import errorHandler from "./middleware/error-handler.middleware.js";
import router from "./router.js";

const app = express();
const server = http.createServer(app);

app.disable("x-powered-by");

connectDB();

app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.send("Health Compass development server is running test");
});

app.use("/api", router.productRoute);

app.use(errorHandler);

server.listen(8001, () => {
  console.log(`Server is running on port http://localhost:8001`);
});

process.on("uncaughtException", function (err) {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", function (err) {
  console.error("Unhandled Rejection:", err);
});
