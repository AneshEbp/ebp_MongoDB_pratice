import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    ph_no: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    role: { type: String, enum: ["user", "seller", "admin"], default: "user" },
    latestCart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1, verified: 1 });

const User = mongoose.model("User", userSchema);

export default User;
