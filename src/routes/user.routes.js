import express from "express";
import {
  getUserProfile,
  loginUser,
  registerUser,
  updateUserProfile,
  verifyUser,
} from "../controllers/user.controller.js";
import { tokenVerify } from "../middleware/tokenVerify.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify", tokenVerify, verifyUser);
router.get("/profile", tokenVerify, getUserProfile);
router.put("/update-profile", tokenVerify, updateUserProfile);

export default router;
