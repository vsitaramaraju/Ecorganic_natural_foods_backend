const { MAX_DELIVERY_FEE, getDeliveryFee, setDeliveryFee } = require("../src/utils/delivery");
const {
  getFestivalTheme,
  parseFestivalInput,
  saveFestivalTheme
} = require("../src/utils/festivalTheme");

// GET /api/settings/delivery - public: the cart, checkout and policy pages show this fee.
exports.getDeliverySettings = async (req, res) => {
  try {
    res.json({ deliveryFee: await getDeliveryFee() });
  } catch (error) {
    console.error("Failed to load delivery settings:", error);
    res.status(500).json({ message: "Could not load the delivery fee" });
  }
};

// PUT /api/admin/settings/delivery - admin: { deliveryFee } in ₹, 0 means free delivery.
exports.updateDeliverySettings = async (req, res) => {
  const raw = req.body?.deliveryFee;
  const fee = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;

  if (typeof fee !== "number" || !Number.isFinite(fee) || fee < 0 || fee > MAX_DELIVERY_FEE) {
    return res
      .status(400)
      .json({ message: `Delivery fee must be a number from 0 to ${MAX_DELIVERY_FEE}` });
  }

  try {
    const deliveryFee = await setDeliveryFee(Math.round(fee * 100) / 100);
    res.json({ message: "Delivery fee updated", deliveryFee });
  } catch (error) {
    console.error("Failed to save delivery settings:", error);
    res.status(500).json({ message: "Could not save the delivery fee" });
  }
};

// GET /api/settings/theme - public: the storefront shows the active festival theme.
exports.getThemeSettings = async (req, res) => {
  try {
    res.json(await getFestivalTheme());
  } catch (error) {
    console.error("Failed to load festival theme:", error);
    res.status(500).json({ message: "Could not load the festival theme" });
  }
};

// PUT /api/admin/settings/theme - admin: { theme, message, endsAt, recolor, decorations }.
exports.updateThemeSettings = async (req, res) => {
  const { data, error } = parseFestivalInput(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const theme = await saveFestivalTheme(data);
    res.json({ message: "Festival theme updated", theme });
  } catch (err) {
    console.error("Failed to save festival theme:", err);
    res.status(500).json({ message: "Could not save the festival theme" });
  }
};
