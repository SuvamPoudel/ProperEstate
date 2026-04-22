const mongoose = require("mongoose");

// ── Builder / Construction Company Profile ────────────────────────────────────
const builderProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

  // Company / Team info
  companyName: { type: String, required: true },
  companyType: {
    type: String,
    enum: ["company", "contractor", "freelance_team", "individual"],
    default: "company"
  },
  registrationNumber: { type: String, default: "" },
  establishedYear: { type: Number, default: null },
  address: { type: String, default: "" },
  province: { type: String, default: "" },
  district: { type: String, default: "" },
  city: { type: String, default: "" },
  website: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },

  // Description
  description: { type: String, default: "" },
  specializations: [{ type: String }],  // e.g. ["house", "villa", "commercial"]
  yearsOfExperience: { type: Number, default: 0 },
  completedProjects: { type: Number, default: 0 },

  // Workers / Team
  workers: [{
    name: { type: String },
    role: { type: String },   // e.g. "Civil Engineer", "Mason", "Electrician"
    experience: { type: String }
  }],

  // Legitimacy proof (confidential — admin only)
  proofDocuments: [{ type: String }],  // uploaded filenames (company reg, PAN, etc.)
  proofDocType: { type: String, default: "" },  // "company_registration" | "pan_vat" | "other"

  // Admin review
  verificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    index: true
  },
  adminNote: { type: String, default: "" },
  verifiedAt: { type: Date, default: null },

  // Portfolio images
  portfolioImages: [{ type: String }],

  // Rating (computed from completed deals)
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

builderProfileSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("BuilderProfile", builderProfileSchema);
