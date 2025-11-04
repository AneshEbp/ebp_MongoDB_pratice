import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema({
 ProductDetailsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductDetails",
    required: true,
  },
  color: {
    type: String,
  },

  size: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
});
productVariantSchema.index({ ProductDetailsId: 1, color: 1, size: 1 });

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);
export default ProductVariant;
