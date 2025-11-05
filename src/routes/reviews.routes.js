import express from "express";
import { tokenVerify } from "../middleware/tokenVerify.js";
import { createReview, deleteReview, getReviewsByProduct, updateReview } from "../controllers/reviews.controller.js";

const router = express.Router();

router.post("/create", tokenVerify, createReview);
router.get("/getReviewsByProduct/:productId", getReviewsByProduct);
router.put("/update/:reviewId", tokenVerify, updateReview);
router.delete("/delete", tokenVerify, deleteReview);

export default router;
