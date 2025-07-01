import mongoose  from 'mongoose';

const DrugsDetailsSchema = new mongoose.Schema({
  setid: { type: String, unique: true, required: true },
  xmlJson: { type: Object, required: true },
}, { timestamps: true });


const DrugsDetails= mongoose.model("DrugsDetails", DrugsDetailsSchema);

export default DrugsDetails;