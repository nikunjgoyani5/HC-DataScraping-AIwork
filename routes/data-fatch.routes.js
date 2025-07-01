import express from "express";
import controller from "../controllers/data-fatch.controller.js";

const route = express.Router();

route.get("/get-all-supplements", controller.getAllSupplementDetails);
route.get("/get-all-drugs", controller.getAllDrugsDetails);
route.get("/get-all-ingredients", controller.getAllIngredientDetails);

export default route;
