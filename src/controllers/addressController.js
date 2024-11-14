const Address = require("../models/Address");

exports.addAddress = async (req, res) => {
  try {
    const { user_id, line1, line2, city, state, postal_code, country } = req.body;

    // Verifique se todos os campos obrigatórios foram preenchidos
    if (!user_id || !line1 || !city || !state || !postal_code || !country) {
      return res.status(400).json({ error: "Please fill in all required fields" });
    }

    const address = await Address.create({
      user_id,
      line1,
      line2,
      city,
      state,
      postal_code,
      country,
    });

    res.status(201).json({ message: "Address added successfully", address });
  } catch (error) {
    res.status(500).json({ error: "Failed to add address" });
  }
};
