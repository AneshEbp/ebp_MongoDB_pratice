import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./db/connectDB.js";

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());

import userRoutes from "./routes/user.routes.js";
app.use("/api/users", userRoutes);

import categoryRoutes from "./routes/category.routes.js";
app.use("/api/categories", categoryRoutes);

import productRoutes from "./routes/product.routes.js";
app.use("/api/products", productRoutes);

import reviewRoutes from "./routes/reviews.routes.js";
app.use("/api/reviews", reviewRoutes);

import cartRoutes from "./routes/cart.routes.js";
app.use("/api/cart", cartRoutes);

import orderRoutes from "./routes/order.routes.js";
app.use("/api/order", orderRoutes);

app.listen(process.env.PORT || 3000, async () => {
  await connectDB();
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
