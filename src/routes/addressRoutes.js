const express = require("express");
const { addAddress } = require("../controllers/addressController");
const router = express.Router();

router.post("/add", addAddress);

module.exports = router;
