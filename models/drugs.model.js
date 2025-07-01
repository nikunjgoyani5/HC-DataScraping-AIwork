import mongoose  from 'mongoose';

const drugsSchema = new mongoose.Schema({
  setid: {
    type: String,
    required: true,
    unique: true,
  },
  data: {
    type: Object,
    required: true,
  },
}, { timestamps: true });


const Drugs= mongoose.model("Drugs", drugsSchema);

export default Drugs;