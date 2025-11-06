import mongoose from "mongoose";
import Cart from "../model/cart.model.js";
import LargeCartItem from "../model/large_Cart_Items.model.js";

export const createCart = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const userId = req.user.userId;
    const { items } = req.body;

    if (!items || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Cart items are required." });
    }

    // Find active cart for user
    let cartt = await Cart.findOne({ userId, status: "active" }).session(
      session
    );

    if (!cartt) {
      // No active cart → create new cart
      const totalAmount = items.reduce(
        (sum, i) => sum + i.unit_price * i.quantity,
        0
      );
      cartt = new Cart({ userId, cart_items: [], totalAmount }); // start with empty array

      // Check if items exceed 500
      if (items.length > 500) {
        const itemsForCart = items.slice(0, 500); // first 500 items in cart
        const itemsForLargeCart = items.slice(500); // remaining to LargeCartItem

        cartt.cart_items.push(...itemsForCart);
        await cartt.save({ session });

        // Save remaining items to LargeCartItem
        const largeItems = itemsForLargeCart.map((item) => ({
          cartId: cartt._id,
          productId: item.productId,
          color: item.color,
          size: item.size,
          unit_price: item.unit_price,
          quantity: item.quantity,
          totalAmount: item.unit_price * item.quantity,
        }));
        await LargeCartItem.insertMany(largeItems, { session });
      } else {
        cartt.cart_items.push(...items);
        await cartt.save({ session });
      }

      await session.commitTransaction();
      return res.status(201).json(cartt);
    }

    const newCartItems = [];

    items.forEach((item) => {
      const existingItem = cartt.cart_items.find(
        (i) =>
          i.productId.toString() === item.productId.toString() &&
          i.color.toUpperCase() === item.color.toUpperCase() &&
          i.size.toUpperCase() === item.size.toUpperCase()
      );

      if (existingItem) {
        // Update quantity for existing combination
        existingItem.quantity += item.quantity;
      } else {
        // Add as new item
        newCartItems.push(item);
      }
    });

    // if (newCartItems.length > 0) {
    //   cartt.cart_items.push(...newCartItems);
    // }

    // Add new items to cart or large cart based on total length
    if (cartt.cart_items.length + newCartItems.length > 500) {
      const spaceLeft = 500 - cartt.cart_items.length;
      const itemsForCart = newCartItems.slice(0, spaceLeft);
      const itemsForLargeCart = newCartItems.slice(spaceLeft);

      if (itemsForCart.length > 0) cartt.cart_items.push(...itemsForCart);

      if (itemsForLargeCart.length > 0) {
        const largeItems = itemsForLargeCart.map((item) => ({
          cartId: cartt._id,
          productId: item.productId,
          color: item.color,
          size: item.size,
          unit_price: item.unit_price,
          quantity: item.quantity,
          totalAmount: item.unit_price * item.quantity,
        }));
        await LargeCartItem.insertMany(largeItems, { session });
      }
    } else {
      cartt.cart_items.push(...newCartItems);
    }

    const largeItemsTotal = await LargeCartItem.aggregate([
      { $match: { cartId: cartt._id } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$unit_price", "$quantity"] } },
        },
      },
    ]);

    const largeTotal = largeItemsTotal[0]?.total || 0;

    cartt.totalAmount =
      cartt.cart_items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0) +
      largeTotal;

    await cartt.save({ session });
    await session.commitTransaction();
    res.status(201).json(cartt);
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message + "hello" });
  } finally {
    session.endSession();
  }
};

export const modifyCart = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { cartId } = req.params;
    const { updates } = req.body; // array of { subdocumentId, quantityChange }

    const cart = await Cart.findById(cartId).session(session);
    if (!cart) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Cart does not exist" });
    }

    for (const update of updates) {
      const { subdocumentId, quantityChange } = update;

      // Try to find in cart_items
      let item = cart.cart_items.id(subdocumentId);
      
      if (item) {
        item.quantity = quantityChange;
        if (item.quantity <= 0) {
          // Remove if quantity <= 0
          cart.cart_items = cart.cart_items.filter(
            (i) => i._id.toString() !== subdocumentId
          );
        }
      } else {
        // Try to find in LargeCartItem
        let largeItem = await LargeCartItem.findOne({
          cartId: cart._id,
          _id: subdocumentId,
        }).session(session);

        if (largeItem) {
          largeItem.quantity = quantityChange;
          if (largeItem.quantity <= 0) {
            await LargeCartItem.deleteOne({ _id: subdocumentId }, { session });
          } else {
            largeItem.totalAmount = largeItem.quantity * largeItem.unit_price;
            await largeItem.save({ session });
          }
        } else {
          // If item not found in either, skip or throw error
          continue; // optionally, you can throw error here
        }
      }
    }

    // Recalculate totalAmount
    const largeItemsTotal = await LargeCartItem.aggregate([
      { $match: { cartId: cart._id } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$unit_price", "$quantity"] } },
        },
      },
    ]);
    const largeTotal = largeItemsTotal[0]?.total || 0;

    cart.totalAmount =
      cart.cart_items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0) +
      largeTotal;

    await cart.save({ session });
    await session.commitTransaction();

    res.status(200).json(cart);
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

export const deleteCart = async (req, res) => {
  const session = mongoose.startSession();
  try {
    await session.startTransaction();
    const { cartId } = req.body;
    const cart = await Cart.findByIdAndDelete(cartId).session(session);

    if (!cart) {
      await session.abortTransaction;
      return res.status(404).json({ message: "Cart not found" });
    }
    const deleteCartbucket = await LargeCartItem.deleteMany({ cartId }).session(
      session
    );

    await session.commitTransaction();
    res.status(200).json({ message: "Cart deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    await session.endSession;
  }
};

export const deleteEachItemFromCart = async (req, res) => {
  try {
    const { cartId, cartItemId } = req.body;

    // 1️⃣ Check if cart exists
    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(400).json({ message: "Couldn't find a cart" });
    }

    // 2️⃣ Filter out the item
    const originalLength = cart.cart_items.length;
    cart.cart_items = cart.cart_items.filter(
      (i) => i._id.toString() !== cartItemId
    );

    // 3️⃣ If something was removed, save
    if (cart.cart_items.length < originalLength) {
      await cart.save();
      return res.status(200).json({ message: "Item deleted from cart" });
    }

    // 4️⃣ Otherwise, try deleting from LargeCartItem bucket
    const deleteItemFromBucket = await LargeCartItem.findOneAndDelete({
      _id: cartItemId,
      cartId,
    });

    if (deleteItemFromBucket) {
      return res.status(200).json({ message: "Item deleted from bucket" });
    }

    // 5️⃣ Nothing was deleted anywhere
    return res.status(404).json({ message: "Item not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const getActiveCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(userId)
    const cart = await Cart.findOne({ userId, status: "active" });
    if (!cart) {
      return res
        .status(400)
        .json({ message: "could not find any active cart" });
    }
    let bucketItems = [];
    if (cart.cart_items.length >= 500) {
      bucketItems = await LargeCartItem.find({ cartId: cart._id });
    }

    const allItems = [
      ...cart.cart_items,
      ...(bucketItems && bucketItems.length > 0 ? bucketItems : []),
    ];
    const cartData = cart.toObject();
    cartData.cart_items = allItems;

    res.status(200).json({ cart: cartData });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

export const getCartHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const carts = await Cart.find({ userId });
    if (carts.length == 0) {
      return res
        .status(404)
        .json({ message: "couldnt found any cart history" });
    }
    const cartsWithBuckets = await Promise.all(
      carts.map(async (cart) => {
        let bucketItems = [];

        // Only check if cart_items might be full or if you always store overflow
        if (cart.cart_items.length >= 500) {
          bucketItems = await LargeCartItem.find({ cartId: cart._id });
        }

        // Merge cart_items and bucket items (if any)
        const allItems = [
          ...(cart.cart_items || []),
          ...(bucketItems?.length ? bucketItems : []),
        ];
        const cartData = cart.toObject();
        cartData.cart_items = allItems;

        // Return a combined view
        return cartData;
      })
    );
    return res.status(200).json({
      message: "Cart history fetched successfully",
      carts: cartsWithBuckets,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
