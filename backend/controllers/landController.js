const mongoose = require("mongoose");
const Land = require("../models/Land");
const User = require("../models/User");
const { sendLandApprovalEmail } = require("../emailService");

// Add Land
const addLand = async (req, res) => {
  try {
    const { ownerId } = req.body;

    // Check seller status
    const user = await User.findById(ownerId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Allow if user is admin, seller, or has no accountType (legacy users)
    if (user.role !== "admin" && user.accountType && user.accountType !== "seller") {
      return res.status(403).json({ success: false, message: "Only verified sellers can list properties" });
    }

    // Handle media files
    const mediaFiles = req.files?.media ? req.files.media.map(file => file.filename) : [];
    const lalpurjaImage = req.files?.lalpurja ? req.files.lalpurja[0].filename : null;

    // Create land object
    const landData = {
      ...req.body,
      ownerId: ownerId.toString(), // store as string to match schema
      mediaFiles,
      lalpurjaImage,
      image: mediaFiles[0] || null,
      status: "pending"
    };

    const land = new Land(landData);
    await land.save();

    res.json({
      success: true,
      message: "Property listed successfully! Waiting for admin approval.",
      land
    });
  } catch (error) {
    console.error("Add land error:", error);
    res.status(500).json({ success: false, message: "Server error during property listing" });
  }
};

// Get All Lands (Public - only approved)
const getAllLands = async (req, res) => {
  try {
    const lands = await Land.find({ status: "approved" }).sort({ createdAt: -1 });
    res.json({ success: true, lands });
  } catch (error) {
    console.error("Get lands error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Single Land
const getLandById = async (req, res) => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    res.json({ success: true, land });
  } catch (error) {
    console.error("Get land error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Edit Land (Owner only)
const editLand = async (req, res) => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    // Check ownership (compare as strings to avoid type mismatch)
    if (land.ownerId?.toString() !== req.body.ownerId?.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this property" });
    }

    // Update land
    const updateData = { ...req.body };
    if (req.file) updateData.image = req.file.filename;

    const updatedLand = await Land.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.json({
      success: true,
      message: "Property updated successfully",
      land: updatedLand
    });
  } catch (error) {
    console.error("Edit land error:", error);
    res.status(500).json({ success: false, message: "Server error during property update" });
  }
};

// Search Lands (Live search)
const searchLands = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const searchRegex = new RegExp(q, "i");
    const results = await Land.find({
      status: "approved",
      $or: [
        { title: searchRegex },
        { location: searchRegex },
        { city: searchRegex },
        { district: searchRegex },
        { province: searchRegex },
        { category: searchRegex },
        { subCategory: searchRegex }
      ]
    }).limit(10);

    res.json({ success: true, results });
  } catch (error) {
    console.error("Search lands error:", error);
    res.status(500).json({ success: false, message: "Search error" });
  }
};

// Toggle Save Land
const toggleSaveLand = async (req, res) => {
  try {
    const { userId, landId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const savedLands = (user.savedLands || []).map(id => id.toString());
    const isAlreadySaved = savedLands.includes(landId.toString());

    // Use $pull / $addToSet so Mongoose strict mode doesn't block it
    const update = isAlreadySaved
      ? { $pull: { savedLands: new mongoose.Types.ObjectId(landId) } }
      : { $addToSet: { savedLands: new mongoose.Types.ObjectId(landId) } };

    const updated = await User.findByIdAndUpdate(userId, update, { new: true });

    res.json({
      success: true,
      message: isAlreadySaved ? "Removed from wishlist" : "Added to wishlist",
      savedLands: (updated.savedLands || []).map(id => id.toString())
    });
  } catch (error) {
    console.error("Toggle save error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get User Dashboard Data
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.params.userId;
    const userIdStr = userId.toString();

    // Build query to match ownerId regardless of how it was stored (ObjectId or String)
    let objectId;
    try { objectId = new mongoose.Types.ObjectId(userId); } catch { objectId = null; }

    const ownerQuery = objectId
      ? { $or: [{ ownerId: userIdStr }, { ownerId: objectId }] }
      : { ownerId: userIdStr };

    // Get ALL lands owned by this user (pending, approved, rejected)
    const uploaded = await Land.find(ownerQuery).sort({ createdAt: -1 });

    console.log(`[Dashboard] userId=${userIdStr}, found ${uploaded.length} uploaded lands`);

    // Get saved lands
    const user = await User.findById(userId);
    const savedLandIds = (user?.savedLands || []).map(id => {
      try { return new mongoose.Types.ObjectId(id.toString()); } catch { return null; }
    }).filter(Boolean);

    const saved = savedLandIds.length > 0
      ? await Land.find({ _id: { $in: savedLandIds } })
      : [];

    res.json({ success: true, uploaded, saved });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  addLand,
  getAllLands,
  getLandById,
  editLand,
  searchLands,
  toggleSaveLand,
  getUserDashboard
};