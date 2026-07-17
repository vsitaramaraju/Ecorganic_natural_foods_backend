const prisma = require("../src/utils/prisma");

exports.addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, street, city, state, pincode, country } = req.body;

    const address = await prisma.address.create({
      data: {
        userId,
        name,
        phone,
        street,
        city,
        state,
        pincode,
        country
      }
    });

    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await prisma.address.findMany({
      where: { userId }
    });

    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = parseInt(req.params.id, 10);

    if (Number.isNaN(addressId)) {
      return res.status(400).json({ message: "Invalid address id" });
    }

    // Only allow the fields an address actually has — never let the body
    // sneak in userId or id and reassign the address to someone else.
    const { name, phone, street, city, state, pincode, country, isDefault } =
      req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (street !== undefined) data.street = street;
    if (city !== undefined) data.city = city;
    if (state !== undefined) data.state = state;
    if (pincode !== undefined) data.pincode = pincode;
    if (country !== undefined) data.country = country;
    if (isDefault !== undefined) data.isDefault = isDefault;

    const existing = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ message: "Address not found" });
    }

    const updated = await prisma.address.update({
      where: { id: addressId },
      data
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = parseInt(req.params.id, 10);

    if (Number.isNaN(addressId)) {
      return res.status(400).json({ message: "Invalid address id" });
    }

    const existing = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ message: "Address not found" });
    }

    await prisma.address.delete({
      where: { id: addressId }
    });

    res.json({ message: "Address deleted" });
  } catch (error) {
    // Address is still referenced by an existing order — can't hard-delete
    // it without breaking that order's history.
    if (error.code === "P2003") {
      return res.status(400).json({
        message: "This address is linked to a past order and can't be deleted."
      });
    }
    res.status(500).json({ error: error.message });
  }
};
