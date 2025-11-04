import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    path: {
      type: String,
    },
  },
  { timestamps: true }
);
categorySchema.index({ name: 1 }, { unique: true });
const Category = mongoose.model("Category", categorySchema);
export default Category;
