import express from "express";
import Productcontroller from "../controllers/product.controller.js";

const route = express.Router();

route.get("/sync-products", Productcontroller.fetchAndStoreAllProducts);
route.get("/sync-ingredient", Productcontroller.fetchAllIngredientGroups);
route.get("/sync-ingredient-details", Productcontroller.fetchAndStoreFactsheets);
route.get("/sync-supplement-details", Productcontroller.fetchAndStoreSupplementLabels);
route.get("/sync-drugs", Productcontroller.fetchAndStoreDailyMedDrugs);
route.get("/sync-drug-details", Productcontroller.fetchAndStoreDrugXML);
route.get("/update-sync-drug-details", Productcontroller.fetchAndUpdateDrugClassification);


export default route;

