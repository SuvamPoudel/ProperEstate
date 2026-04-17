const mongoose = require("mongoose");

const landSchema = new mongoose.Schema({
  title: String,
  location: String,
  price: Number,
  image: String,
  ownerName: String,
  ownerPhone: String,
  available: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("Land", landSchema);
