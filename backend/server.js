const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { sendBookingRequestEmail, sendBookingResponseEmail, sendLandApprovalEmail, sendHelpCenterEmail } = require("./emailService");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* ===================================================== 🔥 MONGODB CONNECTION ===================================================== */
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set in .env file");
  process.exit(1);
}
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
    console.log("✅ MongoDB Atlas Connected Successfully!");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
  }
}
connectDB();

/* ===================================================== 📂 MULTER STORAGE ===================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.fieldname + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* ===================================================== 👤 USER MODEL ===================================================== */
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  role: { type: String, default: "user" }, // user | admin
  accountType: { type: String, default: "buyer" }, // buyer | seller | seller_pending
  avatar: String,
  savedLands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Land" }],
  // Seller verification docs
  sellerDoc: String,       // uploaded citizenship/NID/passport filename
  sellerDocType: String,   // citizenship | nid | passport
  sellerDocStatus: { type: String, default: null }, // null | pending | approved | rejected
});
const User = mongoose.model("User", userSchema);

/* ===================================================== 🏡 LAND MODEL ===================================================== */
const landSchema = new mongoose.Schema({
  title: String,
  location: String,
  province: String,
  district: String,
  city: String,
  price: Number,
  image: String,
  lalpurjaImage: String,
  description: String,
  category: String,
  areaSize: String,
  mapUrl: String,
  ownerName: String,
  ownerPhone: String,
  ownerEmail: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});
const Land = mongoose.model("Land", landSchema);

/* ===================================================== 📝 BOOKING MODEL ===================================================== */
const bookingSchema = new mongoose.Schema({
  landId: { type: mongoose.Schema.Types.ObjectId, ref: "Land" },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "pending" }, // pending, accepted, rejected, refunded
  paymentAmount: Number,
  rentDuration: String, // e.g. "6 months", "1 year"
  rentDurationMonths: Number,
  createdAt: { type: Date, default: Date.now },
});
const Booking = mongoose.model("Booking", bookingSchema);

/* ===================================================== 🔐 AUTH ROUTES ===================================================== */
app.post("/signup", async (req, res) => {
  try {
    const { email } = req.body;
    const role = email === "admin@properestate.com" ? "admin" : "user";
    // New accounts default to buyer; admin gets seller rights automatically
    const accountType = role === "admin" ? "seller" : "buyer";
    const user = new User({ ...req.body, role, accountType });
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.json({ success: false, message: "Invalid credentials" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/update-profile", upload.single("avatar"), async (req, res) => {
  try {
    const { userId, name, phone } = req.body;
    const updateData = { name, phone };
    if (req.file) updateData.avatar = req.file.filename;
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upload seller verification doc
app.post("/become-seller", upload.single("sellerDoc"), async (req, res) => {
  try {
    const { userId, sellerDocType } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: "Document required" });
    const user = await User.findByIdAndUpdate(userId, {
      sellerDoc: req.file.filename,
      sellerDocType,
      sellerDocStatus: "pending",
      accountType: "seller_pending"
    }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===================================================== 🏡 LAND ROUTES ===================================================== */
// Handle multiple files: Main Image + Lalpurja
app.post("/add-land", upload.fields([{ name: "image", maxCount: 1 }, { name: "lalpurja", maxCount: 1 }]), async (req, res) => {
  try {
    // Check seller status — existing users without accountType field are treated as sellers
    const owner = await User.findById(req.body.ownerId);
    if (owner && owner.accountType && owner.accountType !== "seller" && owner.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only verified seller accounts can list properties." });
    }
    const land = new Land({
      ...req.body,
      image: req.files && req.files['image'] ? req.files['image'][0].filename : null,
      lalpurjaImage: req.files && req.files['lalpurja'] ? req.files['lalpurja'][0].filename : null,
      status: "pending"
    });
    await land.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/lands", async (req, res) => {
  try {
    // ONLY FETCH APPROVED LANDS FOR PUBLIC
    const lands = await Land.find({ status: "approved" }).sort({ createdAt: -1 });
    res.json({ success: true, lands });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/land/:id", async (req, res) => {
  try {
    const land = await Land.findById(req.params.id);
    res.json({ success: true, land });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get public user info (for chat)
app.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name avatar email");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Edit land - only owner can edit
app.put("/edit-land/:id", upload.single("image"), async (req, res) => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) return res.status(404).json({ success: false, message: "Land not found" });
    if (land.ownerId?.toString() !== req.body.ownerId)
      return res.status(403).json({ success: false, message: "Unauthorized" });

    const updateData = { ...req.body };
    delete updateData.ownerId;
    if (req.file) updateData.image = req.file.filename;

    const updated = await Land.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, land: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===================================================== 👑 ADMIN ROUTES ===================================================== */
app.get("/admin/users", async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: approve or reject seller verification
app.post("/admin/verify-seller/:id", async (req, res) => {
  try {
    const { status } = req.body; // "approved" | "rejected"
    const accountType = status === "approved" ? "seller" : "buyer";
    const user = await User.findByIdAndUpdate(req.params.id, {
      sellerDocStatus: status,
      accountType
    }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: manually set account type
app.post("/admin/set-account-type/:id", async (req, res) => {
  try {
    const { accountType } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { accountType }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/admin/all-lands", async (req, res) => {
  try {
    const lands = await Land.find().sort({ createdAt: -1 });
    res.json({ success: true, lands });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/admin/verify-land/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const land = await Land.findByIdAndUpdate(req.params.id, { status }, { new: true });
    // Send email to owner
    if (land && land.ownerEmail) {
      sendLandApprovalEmail(land.ownerEmail, land.ownerName, land.title, status).catch(console.error);
    }
    res.json({ success: true, message: `Land ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/admin/delete-land/:id", async (req, res) => {
  try {
    await Land.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Land deleted permanently" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/admin/delete-user/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Land.deleteMany({ ownerId: req.params.id });
    res.json({ success: true, message: "User and their assets deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===================================================== 🤝 BOOKING ROUTES ===================================================== */
app.post("/book-land", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    const land = await Land.findById(req.body.landId);
    const buyer = await User.findById(req.body.buyerId);
    const owner = await User.findById(req.body.sellerId);
    if (land && buyer && owner && owner.email) {
      sendBookingRequestEmail(owner.email, owner.name, buyer.name, buyer.email, land.title).catch(console.error);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/seller/bookings/:userId", async (req, res) => {
  try {
    const bookings = await Booking.find({ sellerId: req.params.userId }).populate("landId").populate("buyerId");
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/seller/respond-booking/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = status === "rejected" ? { status, paymentStatus: "refunded" } : { status };
    const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("landId").populate("buyerId");
    // Send email to buyer
    if (booking && booking.buyerId && booking.buyerId.email) {
      sendBookingResponseEmail(booking.buyerId.email, booking.buyerId.name, booking.landId?.title, status).catch(console.error);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===================================================== 🔍 & ❤️ SEARCH/SAVE ===================================================== */
app.get("/search-live", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json({ success: true, results: [] });
    const results = await Land.find({
      status: "approved",
      $or: [
        { title: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
        { district: { $regex: q, $options: "i" } },
        { province: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ]
    }).limit(8).select("title location city district province category price image");
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/toggle-save", async (req, res) => {
  try {
    const { userId, landId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false });
    const index = user.savedLands.indexOf(landId);
    if (index === -1) user.savedLands.push(landId);
    else user.savedLands.splice(index, 1);
    await user.save();
    res.json({ success: true, savedLands: user.savedLands });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/user-dashboard/:userId", async (req, res) => {
  try {
    const uploaded = await Land.find({ ownerId: req.params.userId });
    const user = await User.findById(req.params.userId).populate("savedLands");
    res.json({ success: true, uploaded, saved: user?.savedLands || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===================================================== 💬 CHAT MODEL & ROUTES ===================================================== */
// Messages auto-delete 1 minute after being read by recipient
const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true }, // "userId1_userId2" sorted
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: String,
  readAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});
// TTL index: delete 60s after readAt is set
messageSchema.index({ readAt: 1 }, { expireAfterSeconds: 60, partialFilterExpression: { readAt: { $ne: null } } });
const Message = mongoose.model("Message", messageSchema);

// Get or create a chat room between two users
function getRoomId(a, b) {
  return [a.toString(), b.toString()].sort().join("_");
}

// Send a message
app.post("/chat/send", async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;
    const roomId = getRoomId(senderId, receiverId);
    const msg = await Message.create({ roomId, senderId, text });
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get messages for a room (and mark unread ones as read)
app.get("/chat/messages/:userId/:otherId", async (req, res) => {
  try {
    const { userId, otherId } = req.params;
    const roomId = getRoomId(userId, otherId);
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).limit(100);
    // Mark messages sent by other user as read (triggers TTL countdown)
    await Message.updateMany(
      { roomId, senderId: otherId, readAt: null },
      { $set: { readAt: new Date() } }
    );
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get list of conversations for a user (unique partners)
app.get("/chat/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      roomId: { $regex: userId }
    }).sort({ createdAt: -1 });

    const seen = new Set();
    const convos = [];
    for (const m of messages) {
      const otherId = m.roomId.replace(userId, "").replace("_", "");
      if (!seen.has(otherId) && otherId) {
        seen.add(otherId);
        const other = await User.findById(otherId).select("name avatar");
        const unread = await Message.countDocuments({ roomId: m.roomId, senderId: otherId, readAt: null });
        convos.push({ user: other, lastMessage: m.text, unread, roomId: m.roomId });
      }
    }
    res.json({ success: true, conversations: convos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Unread count for a user
app.get("/chat/unread/:userId", async (req, res) => {
  try {
    const count = await Message.countDocuments({
      roomId: { $regex: req.params.userId },
      senderId: { $ne: req.params.userId },
      readAt: null
    });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===================================================== 📩 HELP CENTER ===================================================== */
app.post("/help-center", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await sendHelpCenterEmail(name, email, message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});