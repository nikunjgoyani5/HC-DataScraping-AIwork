import express from "express";
import botcontroller from "../controllers/phase-2-bot.controller.js";

const route = express.Router();

route.post("/ask", botcontroller.handleProductQuery);

export default route;
