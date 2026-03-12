import express from "express";
import Tracker from "../models/trackerModel.js";

const router = express.Router();

router.post("/save",async(req,res)=>{

const tracker = new Tracker(req.body);

await tracker.save();

res.json({success:true});

});

router.get("/:userId",async(req,res)=>{

const data = await Tracker
.find({userId:req.params.userId})
.sort({createdAt:-1});

res.json(data);

});

export default router;