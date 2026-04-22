const User = require("../models/User");
const Land = require("../models/Land");
const BackgroundMedia = require("../models/BackgroundMedia");
const { sendLandApprovalEmail } = require("../emailService");

// Get All Users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } });
    res.json({ success: true, users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Verify Seller (Admin only)
const verifySeller = async (req, res) => {
  try {
    const { status } = req.body; // "approved" | "rejected"
    const userId = req.params.id;

    const accountType = status === "approved" ? "seller" : "buyer";
    const user = await User.findByIdAndUpdate(userId, { accountType }, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: `Seller verification ${status}`,
      user
    });
  } catch (error) {
    console.error("Verify seller error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Set Account Type (Admin only)
const setAccountType = async (req, res) => {
  try {
    const { accountType } = req.body;
    const userId = req.params.id;

    const user = await User.findByIdAndUpdate(userId, { accountType }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Account type updated", user });
  } catch (error) {
    console.error("Set account type error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get All Lands (Admin only)
const getAllLandsAdmin = async (req, res) => {
  try {
    const lands = await Land.find().sort({ createdAt: -1 });
    res.json({ success: true, lands });
  } catch (error) {
    console.error("Get all lands error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Verify Land (Admin only)
const verifyLand = async (req, res) => {
  try {
    const { status } = req.body;
    const landId = req.params.id;

    const land = await Land.findByIdAndUpdate(landId, { status }, { new: true });
    if (!land) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    // Send email notification
    if (status === "approved") {
      await sendLandApprovalEmail(land.ownerEmail, land.title, "approved");
    }

    res.json({ success: true, message: `Property ${status}`, land });
  } catch (error) {
    console.error("Verify land error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete Land (Admin only)
const deleteLand = async (req, res) => {
  try {
    const land = await Land.findByIdAndDelete(req.params.id);
    if (!land) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    res.json({ success: true, message: "Property deleted successfully" });
  } catch (error) {
    console.error("Delete land error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete User (Admin only)
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Delete user's lands first
    await Land.deleteMany({ ownerId: userId });

    // Delete user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User and their properties deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Background Media Management
const uploadBackgroundMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Media file required" });
    }

    const { type } = req.body;
    const filename = req.file.filename;

    // Get the next order number
    const lastMedia = await BackgroundMedia.findOne().sort({ order: -1 });
    const order = lastMedia ? lastMedia.order + 1 : 1;

    const media = new BackgroundMedia({
      url: filename,
      type: type || "image",
      active: false,
      order
    });

    await media.save();

    res.json({
      success: true,
      message: "Background media uploaded successfully",
      media
    });
  } catch (error) {
    console.error("Upload background media error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getBackgroundMedia = async (req, res) => {
  try {
    const media = await BackgroundMedia.find().sort({ order: 1 });
    res.json({ success: true, media });
  } catch (error) {
    console.error("Get background media error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateBackgroundMedia = async (req, res) => {
  try {
    const { active, order } = req.body;
    const mediaId = req.params.id;

    const updateData = {};
    if (typeof active === 'boolean') updateData.active = active;
    if (typeof order === 'number') updateData.order = order;

    const media = await BackgroundMedia.findByIdAndUpdate(mediaId, updateData, { new: true });
    if (!media) {
      return res.status(404).json({ success: false, message: "Media not found" });
    }

    res.json({ success: true, message: "Media updated successfully", media });
  } catch (error) {
    console.error("Update background media error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteBackgroundMedia = async (req, res) => {
  try {
    const media = await BackgroundMedia.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ success: false, message: "Media not found" });
    }

    // Delete file from filesystem
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join("uploads", media.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await BackgroundMedia.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Media deleted successfully" });
  } catch (error) {
    console.error("Delete background media error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Public route: Get active background media
const getActiveBackgroundMedia = async (req, res) => {
  try {
    const media = await BackgroundMedia.find({ active: true }).sort({ order: 1 });
    res.json({ success: true, media });
  } catch (error) {
    console.error("Get active background media error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  verifySeller,
  setAccountType,
  getAllLandsAdmin,
  verifyLand,
  deleteLand,
  deleteUser,
  uploadBackgroundMedia,
  getBackgroundMedia,
  updateBackgroundMedia,
  deleteBackgroundMedia,
  getActiveBackgroundMedia
};