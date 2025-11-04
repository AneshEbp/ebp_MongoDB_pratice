import Product from "../model/product.model";
import ProductDetails from "../model/productDetails";
import ProductVariant from "../model/productVariants.model";
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
    if (!savedProduct) {
      return res.status(500).json({ message: "Failed to create product" });
    }
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
          productId: savedProductDetails._id,
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

    res.status(500).json({ message: "Internal Server Error" });
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
    const product = await Product.findById(id)
      .populate({
        path: "detailedInfo", // virtual on Product
        populate: { path: "variants" }, // virtual on ProductDetails
      })
      .lean();
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
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
      { productId: deletedProduct._id },
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
