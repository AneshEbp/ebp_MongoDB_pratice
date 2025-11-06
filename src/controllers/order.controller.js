import mongoose from "mongoose";
import Cart from "../model/cart.model.js";
import Order from "../model/order.model.js";

export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    const userId = req.user.userId;
    const { cartId, shippingAddress } = req.body;

    const cart = await Cart.findOne({
      _id: cartId,
      userId,
      status: "active",
    }).session(session);
    if (!cart) {
      await session.abortTransaction();
      return res.status(404).json({ message: "cant find cart" });
    }
    const order = new Order({
      userId,
      cartId,
      shippingAddress,
      totalAmount: cart.totalAmount,
    });
    await order.save({ session });

    cart.status = "pending";
    await cart.save({ session });

    await session.commitTransaction();
    res.status(200).json({ message: "order placed successfully" });
  } catch (err) {
    await session.abortTransaction();
    console.log(err);
    res.status(500).json({ message: err.message });
  } finally {
    await session.endSession();
  }
};

export const updatePayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const userId = req.user.userId;
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "could not find the order" });
    }
    order.paymentMethod = paymentMethod;
    order.isPaid = true;
    await order.save();
    res.status(200).json({ message: "order placed successfully" });
  } catch (err) {
    console.log(err);
    return res.satus(500).json({ message: err.message });
  }
};

export const updateDeliveryInfo = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const userId = req.user.userId;
    const { orderId } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          isDelivered: true,
        },
      },
      { session, new: true }
    );

    if (!order) {
      await session.abortTransaction();

      return res.status(404).json({ message: "could not find order" });
    }
    await Cart.findOneAndUpdate(
      { userId, _id: order.cartId },
      {
        $set: {
          status: "completed",
        },
      }
    ).session(session);
    await session.commitTransaction();
    res.status(200).json({ message: "Delivery info updated successfully" });
  } catch (err) {
    await session.abortTransaction();
    console.log(err);
    return res.satus(500).json({ message: err.message });
  } finally {
    await session.endSession();
  }
};

export const getActiveOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await Order.find({
      userId,
      isDelivered: false,
    });
    if ( orders.length <= 0) {
      return res.status(404).json({ message: "no order placed yet" });
    }
    return res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "server error" + err.message });
  }
};

export const getAllOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await Order.find({
      userId,
    });
    if (!orders && orders.length <= 0) {
      return res.satus(404).json({ message: "no order placed yet" });
    }
    return res.status(200).json(orders);
  } catch (err) {
    res.satus(500).json({ message: "server error" });
  }
};
