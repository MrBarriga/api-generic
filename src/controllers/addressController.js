const Address = require("../models/Address");

exports.createAddress = async (req, res) => {
  try {
    const { user_id, line1, line2, city, state, postal_code, country } = req.body;

    const address = await Address.create({
      user_id,
      line1,
      line2,
      city,
      state,
      postal_code,
      country,
    });

    res.status(201).json({ message: "Address created successfully", address });
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({ error: "Failed to create address" });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { address_id, line1, line2, city, state, postal_code, country } = req.body;

    const address = await Address.findByPk(address_id);

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    if (address.user_id !== req.user.id) {
      return res.status(403).json({ error: "You do not have permission to update this address" });
    }

    await address.update({
      line1: line1 || address.line1,
      line2: line2 || address.line2,
      city: city || address.city,
      state: state || address.state,
      postal_code: postal_code || address.postal_code,
      country: country || address.country,
    });

    res.status(200).json({ message: "Address updated successfully", address });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ error: "Failed to update address" });
  }
};
