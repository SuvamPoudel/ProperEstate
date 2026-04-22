const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },           // "user" | "admin"
  accountType: { type: String, default: "" },        // "" | "seller" | "seller_pending"
  avatar: { type: String, default: "" },
  profileImage: { type: String, default: "" },
  savedLands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Land" }],
  sellerDocType: { type: String, default: "" },
  sellerDoc: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
