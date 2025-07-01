import mongoose from "mongoose";

const { Schema } = mongoose; 

const ingredientsSchema = new Schema(
  {
    data: {
      type: Schema.Types.Mixed, // flexible key-value storage
      required: true,
    },
    sourceId: {
      type: String, // can be ProductID from the API
      required: false,
    },
  },
  {
    timestamps: true, 
  }
);

const Ingredients= mongoose.model("Ingredients", ingredientsSchema);

export default Ingredients;
