import express from "express";
import { tokenVerify } from "../middleware/tokenVerify.js";
import {
  createCart,
  deleteCart,
  modifyCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

router.post("/create", tokenVerify, createCart);
router.put("/update", tokenVerify, modifyCart);
router.delete("/delete", tokenVerify, deleteCart);

export default router;
