import mongoose from "mongoose";

const emissionSchema = new mongoose.Schema({
  userId:{
    type:String,
    required:true
  },
  transport:{
    type:Number,
    default:0
  },
  electricity:{
    type:Number,
    default:0
  },
  food:{
    type:Number,
    default:0
  },
  total:{
    type:Number,
    required:true
  },
  createdAt:{
    type:Date,
    default:Date.now
  }
});

export default mongoose.model("Emission", emissionSchema);