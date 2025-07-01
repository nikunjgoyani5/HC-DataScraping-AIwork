import mongoose from "mongoose";
import config from "../config/config.js";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://health-compass:health-compass2506@health-compass.sj31v5i.mongodb.net/health-compass-live");
    console.log("Database connection established");
  } catch (error) {
    console.log(`Error connecting to Mongo`, error);
  }
};

export default connectDB;
