import mongoose from "mongoose";

const emissionSchema = new mongoose.Schema({

  userId: {
    type: String,
    required: true,
    index: true 
  },

  transport: {
    type: Number,
    required: true
  },

  electricity: {
    type: Number,
    required: true
  },

  food: {
    type: Number,
    required: true
  },

  total: {
    type: Number,
    required: true
  },

  aqi: {
    type: Number,
    default: null
  },

  carbonSaved: {
    type: Number,
    default: 0
  },

  points: {
    type: Number,
    default: 0
  },

  level: {
    type: String,
    default: "Beginner"
  }

}, {
  timestamps: true 
});

export default mongoose.model("Emission", emissionSchema);