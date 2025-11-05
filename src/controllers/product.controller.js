import Product from "../model/product.model.js";
import ProductDetails from "../model/productDetails.js";
import ProductVariant from "../model/productVariants.model.js";
import mongoose from "mongoose";

export const createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const {
      categoryId,
      name,
      discountRate,
      price,
      quantity,
      description,
      productDetails,
      variants,
    } = req.body;
    console.log(req.body);
    if (!categoryId || !name || !price || !quantity) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newProduct = new Product({
      categoryId,
      name,
      discountRate,
      price,
      quantity,
    });
    const savedProduct = await newProduct.save({ session });
    console.log(savedProduct);
    
    let savedProductDetails;
    if (description || productDetails) {
      const newProductDetails = new ProductDetails({
        productId: savedProduct._id,
        description,
        productDetails,
      });
      savedProductDetails = await newProductDetails.save({ session });
    }

    if (variants) {
      const variantPromises = variants.map((variant) => {
        const newVariants = new ProductVariant({
          ProductDetailsId: savedProductDetails._id,
          color: variant.color,
          size: variant.size,
          price: variant.price,
        });
        return newVariants.save({ session });
      });
      await Promise.all(variantPromises);
    }
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Product created successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const product = await Product.findById(id)
      .populate({
        path: "detailedInfo", 
        populate: { path: "variants" }, 
      })
      .lean();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" , error: error.message});
  }
};

export const deleteProductById = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id, { session });
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    await ProductDetails.findOneAndDelete(
      { productId: deletedProduct._id },
      { session }
    );

    await ProductVariant.deleteMany(
      { ProductDetailsId: deletedProduct._id },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: "Internal Server Error" });
  }
};
