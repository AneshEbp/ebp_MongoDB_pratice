import express from "express";
import { tokenVerify } from "../middleware/tokenVerify.js";
import {
  createCart,
  deleteCart,
  deleteEachItemFromCart,
  getActiveCart,
  getCartHistory,
  modifyCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

router.post("/create", tokenVerify, createCart);
router.put("/update/:cartId", tokenVerify, modifyCart);
router.delete("/delete", tokenVerify, deleteCart);
router.delete("/deleteItems", tokenVerify, deleteEachItemFromCart);
router.get("/activeCart", tokenVerify, getActiveCart);
router.get("/cartHistory", tokenVerify, getCartHistory);

export default router;
