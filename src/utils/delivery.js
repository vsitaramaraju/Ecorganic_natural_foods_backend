const prisma = require("./prisma");

// The delivery fee is set by the admin (Admin → Delivery Fee) and stored in
// StoreSettings. Checkout always charges the stored value; the frontend only displays it.
const SETTINGS_ID = 1;
const DEFAULT_DELIVERY_FEE = 49; // ₹ - used until the admin saves a fee
const MAX_DELIVERY_FEE = 1000; // ₹ - guards against typos like 4900

const getDeliveryFee = async () => {
  const settings = await prisma.storeSettings.findUnique({ where: { id: SETTINGS_ID } });
  return settings ? settings.deliveryFee : DEFAULT_DELIVERY_FEE;
};

const setDeliveryFee = async deliveryFee => {
  const settings = await prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { deliveryFee },
    create: { id: SETTINGS_ID, deliveryFee }
  });
  return settings.deliveryFee;
};

module.exports = { DEFAULT_DELIVERY_FEE, MAX_DELIVERY_FEE, getDeliveryFee, setDeliveryFee };
