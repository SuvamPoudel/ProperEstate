const mongoose = require("mongoose");

const backgroundMediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ["video", "gif", "image"], required: true },
  filename: { type: String, required: true },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BackgroundMedia", backgroundMediaSchema);
