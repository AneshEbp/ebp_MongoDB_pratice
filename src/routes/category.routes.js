import express from "express";
import {
  addCategory,
  deleteCategory,
  getAllCategories,
  getSubCategories,
  markCategoryAsSubCategory,
  updateCategory,
} from "../controllers/category.controller.js";
import { tokenVerify } from "../middleware/tokenVerify.js";
import { roleflag } from "../middleware/roleflag.js";

const router = express.Router();

router.post("/add", tokenVerify, roleflag, addCategory);
router.put(
  "/mark-subcategory",
  tokenVerify,
  roleflag,
  markCategoryAsSubCategory
);
router.get("/all", tokenVerify, roleflag, getAllCategories);
router.get(
  "/subcategories/:categoryId",
  tokenVerify,
  roleflag,
  getSubCategories
);
router.put("/update", tokenVerify, roleflag, updateCategory);
router.delete("/delete", tokenVerify, roleflag, deleteCategory);

export default router;
