import Product from "../model/product.model.js";
import ProductDetails from "../model/productDetails.js";
import ProductVariant from "../model/productVariants.model.js";
import mongoose from "mongoose";

export const createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  if (req.userRole !== "admin") {
    return res
      .status(403)
      .json({ message: "Forbidden: Insufficient permissions" });
  }
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

    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
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
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const deleteProductById = async (req, res) => {
  const session = await mongoose.startSession();
  if (req.userRole !== "admin") {
    return res
      .status(403)
      .json({ message: "Forbidden: Insufficient permissions" });
  }
  try {
    session.startTransaction();

    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id, { session });
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const productDetails = await ProductDetails.findOneAndDelete(
      { productId: deletedProduct._id },
      { session }
    );

    await ProductVariant.deleteMany(
      { ProductDetailsId: productDetails._id },
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

export const updateProductVariant = async (req, res) => {
  if (req.userRole !== "admin") {
    return res
      .status(403)
      .json({ message: "Forbidden: Insufficient permissions" });
  }
  try {
    const { variantId, changes } = req.body;

    if (!variantId || !changes) {
      return res
        .status(400)
        .json({ message: "variantId and changes are required" });
    }

    const variant = await ProductVariant.findById(variantId);
    if (changes.size) variant.size = changes.size;
    if (changes.color) variant.color = changes.color;
    if (changes.price) variant.price = changes.price;

    await variant.save();
    res.status(200).json({ message: "updated" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

export const updateProductDetails = async (req, res) => {
  if (req.userRole !== "admin") {
    return res
      .status(403)
      .json({ message: "Forbidden: Insufficient permissions" });
  }
  try {
    const { productDetailsId, changes } = req.body;

    if (!productDetailsId || !changes) {
      return res
        .status(400)
        .json({ message: "productDetailsId and changes are required" });
    }
    const details = await ProductDetails.findById(productDetailsId);
    if (changes.description) details.description = changes.description;
    if (changes.productDetails) details.productDetails = changes.productDetails;

    await details.save();
    res.status(200).json({ message: "updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "server error" + err });
  }
};
