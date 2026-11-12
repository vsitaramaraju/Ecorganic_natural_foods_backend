const prisma = require("../src/utils/prisma");
const { deleteImageFile, getImageUrlPath } = require("../src/utils/imageUpload");

const BANNER_ID = 1;
const MAX_STATS = 4;
const MAX_HIGHLIGHTS = 3;

// What the home page shows until an admin saves their own banner.
// imageUrl: null means "use the frontend's built-in hero image".
const DEFAULT_BANNER = {
  isVisible: true,
  badge: "🌱 100% Certified Organic",
  title: "Nature's Best,\nDelivered Fresh",
  description:
    "From local farms to your table — hand-picked organic produce, dairy, grains and superfoods with zero compromises.",
  primaryButtonText: "Shop Now",
  primaryButtonLink: "#products",
  secondaryButtonText: "Browse Categories",
  secondaryButtonLink: "/categories",
  stats: [
    { value: "500+", label: "Products" },
    { value: "50+", label: "Farms" },
    { value: "10K+", label: "Happy Customers" }
  ],
  highlights: ["🥕 Freshly Harvested", "✅ Chemical Free", "🚚 Next Day Delivery"],
  imageUrl: null,
  imageAlt: "Fresh organic produce",

  trustVisible: true,
  trustItems: [
    { icon: "🌿", title: "100% Organic", text: "Certified by APEDA" },
    { icon: "🚚", title: "Free Delivery", text: "On orders above ₹499" },
    { icon: "🔄", title: "Easy Returns", text: "No questions asked" },
    { icon: "🛡️", title: "Safe Payments", text: "100% secure checkout" }
  ],

  whyVisible: true,
  whyTitle: "Why EchOrganics?",
  whySubtitle: "We're not just a store — we're a movement for healthier living",
  whyCards: [
    {
      icon: "🌾",
      title: "Direct from Farm",
      text: "We partner directly with certified organic farmers, cutting out middlemen to deliver the freshest produce."
    },
    {
      icon: "🔬",
      title: "Lab Tested",
      text: "Every batch is tested for pesticides and chemicals. We guarantee what's on the label is what's in the pack."
    },
    {
      icon: "♻️",
      title: "Eco Packaging",
      text: "100% biodegradable packaging. We care about your health and the planet equally."
    },
    {
      icon: "💚",
      title: "Community First",
      text: "Every purchase supports local organic farmers and sustainable farming practices in India."
    }
  ],

  ctaVisible: true,
  ctaTitle: "Ready to eat healthier?",
  ctaText: "Join 10,000+ families who switched to organic with EchOrganics",
  ctaButtonText: "Create Free Account →",
  ctaButtonLink: "/register"
};

// Card lists: max number of cards and max length of each card field.
const CARD_LISTS = {
  trustItems: { max: 6, fields: { icon: 8, title: 40, text: 60 } },
  whyCards: { max: 8, fields: { icon: 8, title: 50, text: 250 } }
};

const BOOLEAN_FIELDS = ["isVisible", "trustVisible", "whyVisible", "ctaVisible"];
const LINK_FIELDS = ["primaryButtonLink", "secondaryButtonLink", "ctaButtonLink"];

const TEXT_LIMITS = {
  badge: 60,
  title: 120,
  description: 400,
  primaryButtonText: 30,
  primaryButtonLink: 300,
  secondaryButtonText: 30,
  secondaryButtonLink: 300,
  imageAlt: 150,
  whyTitle: 80,
  whySubtitle: 200,
  ctaTitle: 80,
  ctaText: 200,
  ctaButtonText: 40,
  ctaButtonLink: 300
};

const toPublic = row => ({
  isVisible: row.isVisible,
  badge: row.badge,
  title: row.title,
  description: row.description,
  primaryButtonText: row.primaryButtonText,
  primaryButtonLink: row.primaryButtonLink,
  secondaryButtonText: row.secondaryButtonText,
  secondaryButtonLink: row.secondaryButtonLink,
  stats: Array.isArray(row.stats) ? row.stats : [],
  highlights: Array.isArray(row.highlights) ? row.highlights : [],
  imageUrl: row.imageUrl || null,
  imageAlt: row.imageAlt,
  trustVisible: row.trustVisible,
  trustItems: Array.isArray(row.trustItems) ? row.trustItems : [],
  whyVisible: row.whyVisible,
  whyTitle: row.whyTitle,
  whySubtitle: row.whySubtitle,
  whyCards: Array.isArray(row.whyCards) ? row.whyCards : [],
  ctaVisible: row.ctaVisible,
  ctaTitle: row.ctaTitle,
  ctaText: row.ctaText,
  ctaButtonText: row.ctaButtonText,
  ctaButtonLink: row.ctaButtonLink,
  updatedAt: row.updatedAt
});

// Links may be empty, "#products" (scroll to products), a site path, or an http(s) URL.
const isSafeLink = link =>
  link === "" ||
  link === "#products" ||
  (link.startsWith("/") && !link.startsWith("//")) ||
  /^https?:\/\/[^\s]+$/i.test(link);

const parseJsonArray = (raw, field) => {
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new Error(`${field} must be a JSON array`);
  }
};

// Validates the incoming fields and returns the data object to store.
const buildBannerData = body => {
  const data = {};

  for (const [field, max] of Object.entries(TEXT_LIMITS)) {
    if (body[field] === undefined) continue;
    const value = String(body[field]).trim();
    if (value.length > max) {
      throw new Error(`${field} must be at most ${max} characters`);
    }
    data[field] = value;
  }

  for (const field of LINK_FIELDS) {
    if (data[field] !== undefined && !isSafeLink(data[field])) {
      throw new Error(
        `${field} must be empty, "#products", a path starting with "/", or an http(s) URL`
      );
    }
  }

  if (data.title !== undefined && !data.title) {
    throw new Error("title is required");
  }

  for (const field of BOOLEAN_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field] === true || body[field] === "true";
    }
  }

  for (const [field, { max, fields }] of Object.entries(CARD_LISTS)) {
    const list = parseJsonArray(body[field], field);
    if (list === undefined) continue;
    if (list.length > max) throw new Error(`At most ${max} ${field} allowed`);
    data[field] = list
      .map(card =>
        Object.fromEntries(
          Object.entries(fields).map(([key, limit]) => [
            key,
            String(card?.[key] ?? "").trim().slice(0, limit)
          ])
        )
      )
      .filter(card => card.title || card.text);
  }

  const stats = parseJsonArray(body.stats, "stats");
  if (stats !== undefined) {
    if (stats.length > MAX_STATS) throw new Error(`At most ${MAX_STATS} stats allowed`);
    data.stats = stats
      .map(s => ({
        value: String(s?.value ?? "").trim().slice(0, 20),
        label: String(s?.label ?? "").trim().slice(0, 40)
      }))
      .filter(s => s.value || s.label);
  }

  const highlights = parseJsonArray(body.highlights, "highlights");
  if (highlights !== undefined) {
    if (highlights.length > MAX_HIGHLIGHTS) {
      throw new Error(`At most ${MAX_HIGHLIGHTS} highlights allowed`);
    }
    data.highlights = highlights
      .map(h => String(h ?? "").trim().slice(0, 40))
      .filter(Boolean);
  }

  return data;
};

// GET /api/home-banner (public)
exports.getHomeBanner = async (req, res) => {
  try {
    const row = await prisma.homeBanner.findUnique({ where: { id: BANNER_ID } });
    if (!row) return res.json({ ...DEFAULT_BANNER, isDefault: true });
    res.json({ ...toPublic(row), isDefault: false });
  } catch (error) {
    console.error("getHomeBanner error:", error);
    res.status(500).json({ message: "Failed to load home banner" });
  }
};

// PUT /api/admin/home-banner (admin, multipart: optional "image" file)
exports.updateHomeBanner = async (req, res) => {
  const uploadedUrl = req.file ? getImageUrlPath(req.file.filename) : null;
  try {
    let data;
    try {
      data = buildBannerData(req.body);
    } catch (validationError) {
      if (uploadedUrl) deleteImageFile(uploadedUrl);
      return res.status(400).json({ message: validationError.message });
    }

    const existing = await prisma.homeBanner.findUnique({ where: { id: BANNER_ID } });
    const oldImageUrl = existing?.imageUrl || null;

    if (uploadedUrl) {
      data.imageUrl = uploadedUrl;
    } else if (req.body.removeImage === "true") {
      data.imageUrl = null; // fall back to the built-in hero image
    }

    // First save starts from the defaults so untouched fields keep sensible values.
    const createData = { ...DEFAULT_BANNER, ...data, id: BANNER_ID };

    const row = await prisma.homeBanner.upsert({
      where: { id: BANNER_ID },
      create: createData,
      update: data
    });

    if (oldImageUrl && data.imageUrl !== undefined && data.imageUrl !== oldImageUrl) {
      deleteImageFile(oldImageUrl);
    }

    res.json({ message: "Home banner updated", banner: { ...toPublic(row), isDefault: false } });
  } catch (error) {
    if (uploadedUrl) deleteImageFile(uploadedUrl);
    console.error("updateHomeBanner error:", error);
    res.status(500).json({ message: "Failed to update home banner" });
  }
};

// DELETE /api/admin/home-banner (admin) — restore the default banner
exports.resetHomeBanner = async (req, res) => {
  try {
    const existing = await prisma.homeBanner.findUnique({ where: { id: BANNER_ID } });
    if (existing) {
      await prisma.homeBanner.delete({ where: { id: BANNER_ID } });
      if (existing.imageUrl) deleteImageFile(existing.imageUrl);
    }
    res.json({
      message: "Home banner reset to default",
      banner: { ...DEFAULT_BANNER, isDefault: true }
    });
  } catch (error) {
    console.error("resetHomeBanner error:", error);
    res.status(500).json({ message: "Failed to reset home banner" });
  }
};
