import mongoose, { trusted } from "mongoose";
import Category from "./category.model.js";

const productSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    discountRate: {
      type: Number,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    recentReview: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
      ratingValue: {
        type: Number,
      },
      comment: {
        type: String,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  { timestamps: true }
);

productSchema.index({ CategoryID: 1, name: 1 });

productSchema.virtual("detailedInfo", {
  ref: "ProductDetails",
  localField: "_id",
  foreignField: "productId",
  justOne: false,
});

productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
