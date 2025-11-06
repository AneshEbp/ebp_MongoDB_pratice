import express from "express";
import { tokenVerify } from "../middleware/tokenVerify.js";
import {
  getActiveOrder,
  getAllOrder,
  placeOrder,
  updateDeliveryInfo,
  updatePayment,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/placeorder", tokenVerify, placeOrder);
router.put("/paymentUpdate", tokenVerify, updatePayment);
router.put("/deliveryUpdate", tokenVerify, updateDeliveryInfo);
router.get("/activeOrder", tokenVerify, getActiveOrder);
router.get("/allOrders", tokenVerify, getAllOrder);

export default router;
