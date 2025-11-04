import express from "express";
import dotenv from "dotenv";

import connectDB from "./db/connectDB.js";

const app = express();
dotenv.config();

app.listen(3000, async () => {
  await connectDB();
  console.log("Server is running on port 3000");
});
