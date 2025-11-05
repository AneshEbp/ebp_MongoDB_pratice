import express from "express";
import { createProduct, deleteProductById, getAllProducts, getProductById } from "../controllers/product.controller.js";

const router = express.Router();

router.post('/add', createProduct);
router.get('/getAllProducts', getAllProducts);
router.get('/getProductById/:id', getProductById);
router.delete('/deleteProductById/:id', deleteProductById);


export default router;
