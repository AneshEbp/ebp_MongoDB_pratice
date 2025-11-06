import express from "express";
import {
  createProduct,
  deleteProductById,
  getAllProducts,
  getProductById,
  updateProductDetails,
  updateProductVariant,
} from "../controllers/product.controller.js";
import { tokenVerify } from "../middleware/tokenVerify.js";
import { roleflag } from "../middleware/roleflag.js";

const router = express.Router();

router.post("/add", tokenVerify, roleflag, createProduct);
router.get("/getAllProducts", getAllProducts);
router.get("/getProductById/:id", getProductById);
router.delete(
  "/deleteProductById/:id",
  tokenVerify,
  roleflag,
  deleteProductById
);
router.put(
  "/updateProductVariant",
  tokenVerify,
  roleflag,
  updateProductVariant
);
router.put(
  "/updateProductDetails",
  tokenVerify,
  roleflag,
  updateProductDetails
);

export default router;
