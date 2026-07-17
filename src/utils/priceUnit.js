// Products are priced either as a single fixed item ("fixed") or per a
// weight ("per_<value><unit>", e.g. "per_200g", "per_1.5kg"). The weight is
// admin-defined per product (not limited to a preset list of 100g/250g/500g/
// 1kg) so any real-world pack size — 150g, 200g, 350g, 750g, 1kg, etc. — can
// be used. `stock` for a weight-based product is a count of packs of that
// exact weight (e.g. stock = 40 means 40 packs of "200g" in the warehouse).

const WEIGHT_UNIT_PATTERN = /^per_(\d+(?:\.\d+)?)(g|kg)$/;

const isValidPriceUnit = priceUnit => {
  if (priceUnit === "fixed") return true;
  if (priceUnit === "per_kg") return true; // legacy value, treated as per_1kg
  return WEIGHT_UNIT_PATTERN.test(priceUnit);
};

// Splits "per_200g" -> { value: 200, unit: "g" }, "fixed" -> null
const parsePriceUnit = priceUnit => {
  if (priceUnit === "per_kg") return { value: 1, unit: "kg" }; // legacy value
  const match = WEIGHT_UNIT_PATTERN.exec(priceUnit || "");
  if (!match) return null;
  return { value: Number(match[1]), unit: match[2] };
};

// Builds a priceUnit string from a numeric weight value + unit, e.g.
// buildPriceUnit(200, "g") -> "per_200g"
const buildPriceUnit = (value, unit) => {
  const numericValue = Number(value);
  if (!numericValue || numericValue <= 0 || !["g", "kg"].includes(unit)) {
    return null;
  }
  // Trim trailing zeros from decimals (e.g. 1.50 -> 1.5) but keep whole
  // numbers clean (e.g. 200 -> 200, not 200.0)
  const cleanValue = Number(numericValue.toFixed(2)).toString();
  return `per_${cleanValue}${unit}`;
};

// Human-friendly label, e.g. "per_200g" -> "200g", "per_1.5kg" -> "1.5kg",
// "fixed" -> "unit(s)"
const unitLabel = priceUnit => {
  const parsed = parsePriceUnit(priceUnit);
  if (!parsed) return "unit(s)";
  return `${parsed.value}${parsed.unit} pack(s)`;
};

module.exports = {
  isValidPriceUnit,
  parsePriceUnit,
  buildPriceUnit,
  unitLabel
};
