import mongoose from "mongoose";

const { Schema } = mongoose; 

const SupplimentsSchema = new Schema(
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
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Suppliments= mongoose.model("Suppliments", SupplimentsSchema);

export default Suppliments;
