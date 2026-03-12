import mongoose from "mongoose";

const trackerSchema = new mongoose.Schema({

userId:String,
activity:String,
carbonSaved:Number

},{timestamps:true});

export default mongoose.model("Tracker",trackerSchema);