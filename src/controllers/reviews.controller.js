import mongoose from "mongoose";
import Review from "../model/reviews.model";
import Product from "../model/product.model";

export const createReview = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!productId || !rating || !comment) {
      return res
        .status(400)
        .json({ message: "Product ID, rating, and comment are required." });
    }

    const newReview = new Review({
      productId,
      userId,
      ratingValue: rating,
      comment,
    });
    await newReview.save({ session });

    const productRead = await Product.findById(productId);
    if (!productRead) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Product not found." });
    }

    productRead.recentReview.userID = userId;
    productRead.recentReview.ratingValue = rating;
    productRead.recentReview.comment = comment;
    productRead.recentReview.date = new Date();

    await productRead.save({ session });

    await session.commitTransaction();
    res
      .status(201)
      .json({ message: "Review created successfully.", review: newReview });
  } catch (error) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  } finally {
    session.endSession();
  }
};

export const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate input
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required." });
    }

    const reviews = await Review.find({ productId });

    res.status(200).json({ reviews });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!reviewId) {
      return res.status(400).json({ message: "Review ID is required." });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    // Check if the user is the owner of the review
    if (review.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this review." });
    }

    // Update fields if provided
    if (rating) review.ratingValue = rating;
    if (comment) review.comment = comment;

    await review.save();

    res.status(200).json({ message: "Review updated successfully.", review });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Validate input
    if (!reviewId) {
      return res.status(400).json({ message: "Review ID is required." });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    // Check if the user is the owner of the review
    if (review.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this review." });
    }

    await Review.findByIdAndDelete(reviewId);

    

    res.status(200).json({ message: "Review deleted successfully." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};