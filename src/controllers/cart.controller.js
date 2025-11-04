import Cart from "../model/cart.model";

export const createCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;
    const newCart = await Cart.create({ userId, cart_items:items });
    res.status(201).json(newCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCart = async (req, res) => {
  try {
    const {cartId, items}=req.body;
    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    if(cart.cart_items.length>500){
    }
    items.map(item => {
      const existingItem = cart.cart_items.find(i => i.productId === item.productId);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        cart.cart_items.push(item);
      }
    });
    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 export const deleteCart = async (req, res) => {
  try {
    const { cartId } = req.body;
    const cart = await Cart.findByIdAndDelete(cartId);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.status(200).json({ message: 'Cart deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};