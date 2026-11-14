const prisma = require("./prisma");

// Whether checkout offers Cash on Delivery. Set by the admin (Admin → Delivery &
// Payments) and stored in StoreSettings; online payment (Razorpay) is always
// offered when it is configured.
const SETTINGS_ID = 1;

const isCodEnabled = async () => {
  const settings = await prisma.storeSettings.findUnique({ where: { id: SETTINGS_ID } });
  return settings ? settings.codEnabled : true;
};

const setCodEnabled = async codEnabled => {
  const settings = await prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { codEnabled },
    create: { id: SETTINGS_ID, codEnabled }
  });
  return settings.codEnabled;
};

module.exports = { isCodEnabled, setCodEnabled };
