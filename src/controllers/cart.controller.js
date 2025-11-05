import mongoose from "mongoose";
import Cart from "../model/cart.model.js";
import LargeCartItem from "../model/large_Cart_Items.model.js";

// export const createCart = async (req, res) => {
//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();

//     const userId = req.user.userId;
//     const { items } = req.body;

//     if (!items || items.length === 0) {
//       await session.abortTransaction();
//       return res.status(400).json({ message: "Cart items are required." });
//     }

//     const isCartActive = await Cart.findOne({
//       userId,
//       status: "Active",
//     }).session(session);

//     if (!isCartActive) {
//       const newCart = new Cart({ userId, cart_items: items });
//       await newCart.save({ session });
//       await session.commitTransaction();
//       return res.status(201).json(newCart);
//     }

//     const exisitingItemIds = new Set(
//       isCartActive.cart_items.map((i) => i.productId.toString())
//     );

//     const newCartItems = items.filter(
//       (i) => !exisitingItemIds.has(i.productId.toString())
//     );
//     isCartActive.cart_items.push(...newCartItems);

//     const exisitingItems = items.filter((i) =>
//       exisitingItemIds.has(i.productId.toString())
//     );

//     exisitingItems.forEach((item) => {
//       const cartItem = isCartActive.cart_items.find(
//         (i) => i.productId.toString() === item.productId.toString()
//       );
//       if (cartItem) {
//         cartItem.quantity += item.quantity; // increment quantity
//       }
//     });

//     await isCartActive.save({ session });
//     await session.commitTransaction();
//     res.status(201).json(isCartActive);
//   } catch (err) {
//     await session.abortTransaction();
//     res.status(500).json({ message: err.message });
//   } finally {
//     session.endSession();
//   }
// };

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
        item.quantity += quantityChange;
        if (item.quantity <= 0) {
          // Remove if quantity <= 0
          item.remove();
        }
      } else {
        // Try to find in LargeCartItem
        let largeItem = await LargeCartItem.findOne({
          cartId: cart._id,
          _id: subdocumentId,
        }).session(session);

        if (largeItem) {
          largeItem.quantity += quantityChange;
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
    (await session).startTransaction();
    const { cartId } = req.body;
    const cart = await Cart.findByIdAndDelete(cartId).session(session);

    if (!cart) {
      await session.abortTransaction;
      return res.status(404).json({ message: "Cart not found" });
    }
    const deleteCartbucket = await LargeCartItem.findByIdAndDelete({
      cartId,
    }).session(session);

    await session.commitTransaction();
    res.status(200).json({ message: "Cart deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    await session.endSession;
  }
};
