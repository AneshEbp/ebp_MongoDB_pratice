import mongoose from "mongoose";

const largeCartItemSchema = mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    color: {
      type: String,
    },
    size: {
      type: String,
    },
    unit_price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    totalAmount: {
      type: Number,
    },
  },
  { timestamps: true }
);

largeCartItemSchema.index({ cartId: 1, productId: 1 });

const LargeCartItem = mongoose.model("LargeCartItem", largeCartItemSchema);
export default LargeCartItem;
