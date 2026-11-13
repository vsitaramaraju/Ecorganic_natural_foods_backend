const prisma = require("../src/utils/prisma");
const { unitLabel } = require("../src/utils/priceUnit");

// Upper bound on packs of one product in a cart, so a typo can't create a huge order.
const MAX_QUANTITY_PER_ITEM = 100;

// Returns a whole number >= 1, or null if `value` isn't one.
const parsePositiveInt = value => {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return Number.isInteger(n) && n >= 1 ? n : null;
};

const sendServerError = (res, error) => {
  console.error(error);
  res.status(500).json({ message: "Something went wrong. Please try again." });
};

// Message for a quantity that's more than the product has in stock (or 0 when sold out).
const stockMessage = product =>
  product.stock > 0
    ? `Only ${product.stock} ${unitLabel(product.priceUnit)} of "${product.name}" left in stock`
    : `"${product.name}" is out of stock`;

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = parsePositiveInt(req.body?.productId);
    const quantity =
      req.body?.quantity === undefined ? 1 : parsePositiveInt(req.body.quantity);

    if (!productId) {
      return res.status(400).json({ message: "Invalid product" });
    }
    if (!quantity || quantity > MAX_QUANTITY_PER_ITEM) {
      return res
        .status(400)
        .json({ message: `Quantity must be between 1 and ${MAX_QUANTITY_PER_ITEM}` });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } }
    });
    const newQuantity = (existingItem?.quantity || 0) + quantity;

    if (newQuantity > MAX_QUANTITY_PER_ITEM) {
      return res
        .status(400)
        .json({ message: `You can add at most ${MAX_QUANTITY_PER_ITEM} of one product` });
    }
    if (newQuantity > product.stock) {
      return res.status(409).json({ message: stockMessage(product), available: product.stock });
    }

    if (existingItem) {
      const updated = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity }
      });
      return res.json(updated);
    }

    const newItem = await prisma.cartItem.create({
      data: { userId, productId, quantity }
    });
    res.status(201).json(newItem);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
    });

    res.json(cartItems);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = parsePositiveInt(req.body?.itemId);
    const quantity = parsePositiveInt(req.body?.quantity);

    if (!itemId) {
      return res.status(400).json({ message: "Invalid cart item" });
    }
    if (!quantity || quantity > MAX_QUANTITY_PER_ITEM) {
      return res
        .status(400)
        .json({ message: `Quantity must be between 1 and ${MAX_QUANTITY_PER_ITEM}` });
    }

    // Only ever touch the signed-in user's own cart items.
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, userId },
      include: { product: true }
    });
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    if (quantity > item.product.stock) {
      return res
        .status(409)
        .json({ message: stockMessage(item.product), available: item.product.stock });
    }

    const updated = await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity }
    });
    res.json(updated);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = parsePositiveInt(req.body?.itemId);
    if (!itemId) {
      return res.status(400).json({ message: "Invalid cart item" });
    }

    // Only ever touch the signed-in user's own cart items.
    const result = await prisma.cartItem.deleteMany({ where: { id: itemId, userId } });
    if (result.count === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json({ message: "Item removed" });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await prisma.cartItem.deleteMany({ where: { userId } });
    res.json({ message: "Cart cleared" });
  } catch (error) {
    sendServerError(res, error);
  }
};
