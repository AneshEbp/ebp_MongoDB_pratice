import mongoose, { trusted } from "mongoose";
import Category from "./category.model";

const productSchema = new mongoose.Schema(
  {
    CategoryID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Category,
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
      userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true,
      },
      ratingValue: {
        type: Number,
      },
      comment: {
        type: String,
      },
      updateAt: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);

productSchema.index({ CategoryID: 1, name: 1 });

productSchema.virtual("detailedInfo", {
  ref: "ProductDetail",
  localField: "_id",
  foreignField: "productId",
  justOne: false,   
});

productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
