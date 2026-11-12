// Prisma include for a product's images, in the order the admin arranged them.
// The first image is the product's main image.
const ORDERED_PRODUCT_IMAGES = {
  orderBy: [{ position: "asc" }, { id: "asc" }]
};

module.exports = { ORDERED_PRODUCT_IMAGES };
