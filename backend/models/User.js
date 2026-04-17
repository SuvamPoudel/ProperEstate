const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  phone: {
    type: String,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    default: "user"   // 👈 user or admin
  },

  profileImage: {
    type: String,
    default: ""
  }
});

module.exports = mongoose.model("User", userSchema);
