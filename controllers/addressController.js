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
    const { addressId, ...data } = req.body;

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
    const { addressId } = req.body;

    await prisma.address.delete({
      where: { id: addressId }
    });

    res.json({ message: "Address deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};