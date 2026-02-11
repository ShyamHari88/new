import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Student from "../models/Student.js";

await mongoose.connect(process.env.MONGODB_URI);

const roll = "24IT1A02";
const plain = "24IT1A02";

const hash = await bcrypt.hash(plain, 10);

await Student.updateOne(
  { rollNumber: roll },
  { $set: { passwordHash: hash } }
);

console.log("Password set");

process.exit();
