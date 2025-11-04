import mongoose from "mongoose";

const productDetailsSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  description: {
    type: String,
  },
  productDetails: {
    type: String,
  },
});

productDetailsSchema.index({ productId: 1 });
productDetailsSchema.virtual("virants", {
  ref: "ProductVariant",
  localField: "_id",
  foreignField: "ProductDetailsId",
  justOne: false,
});

productDetailsSchema.set("toObject", { virtuals: true });
productDetailsSchema.set("toJSON", { virtuals: true });

const ProductDetails = mongoose.model("ProductDetails", productDetailsSchema);
export default ProductDetails;
