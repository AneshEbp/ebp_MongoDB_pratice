import mongoose from "mongoose";
import Review from "../model/reviews.model.js";
import Product from "../model/product.model.js";

export const createReview = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { productId, rating, comment } = req.body;
    const userId = req.user.userId;

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
    const savedReview = await newReview.save({ session });

    const productRead = await Product.findById(productId);
    if (!productRead) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Product not found." });
    }

    productRead.recentReview = {
      reviewId: savedReview._id,
      userId,
      ratingValue: rating,
      comment,
      updatedAt: new Date(),
    };

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
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

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
      console.log(review.userId.toString(), userId);
      return res
        .status(403)
        .json({ message: "You are not authorized to update this review." });
    }

    // Update fields if provided
    if (rating) review.ratingValue = rating;
    if (comment) review.comment = comment;

    await review.save({ session });

    const product = await Product.findById(review.productId);
    if (product.recentReview.reviewId.toString() === reviewId) {
      if (rating) product.recentReview.ratingValue = rating;
      if (comment) product.recentReview.comment = comment;
      product.recentReview.updatedAt = new Date();
      await product.save({ session });
    }
    await session.commitTransaction();

    res.status(200).json({ message: "Review updated successfully.", review });
  } catch (err) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  } finally {
    session.endSession();
  }
};

export const deleteReview = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { reviewId } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!reviewId) {
      return res.status(400).json({ message: "Review ID is required." });
    }

    const review = await Review.findById(reviewId).session(session);
    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    // Check if the user is the owner of the review
    if (review.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this review." });
    }

    const deletedReview = await Review.findByIdAndDelete(reviewId).session(
      session
    );

    const product = await Product.findById(deletedReview.productId).session(
      session
    );
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Associated product not found." });
    }

    if (product.recentReview.reviewId.toString() === reviewId) {
      const latestReview = await Review.findOne({ productId: product._id })
        .sort({ createdAt: -1 })
        .skip(1)
        .session(session);

      product.recentReview = {
        reviewId: latestReview ? latestReview._id : null,
        userId: latestReview ? latestReview.userId : null,
        ratingValue: latestReview ? latestReview.ratingValue : null,
        comment: latestReview ? latestReview.comment : null,
        updatedAt: null,
      };
    }
    await product.save({ session });
    await session.commitTransaction();
    res.status(200).json({ message: "Review deleted successfully." });
  } catch (err) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  } finally {
    session.endSession();
  }
};
