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

/* ===================================================== ðŸ”¥ MONGODB CONNECTION ===================================================== */
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("âŒ MONGODB_URI not set in .env file");
  process.exit(1);
}
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
    console.log("âœ… MongoDB Atlas Connected Successfully!");
  } catch (err) {
    console.error("âŒ MongoDB Connection Error:", err.message);
  }
}
connectDB();

/* ===================================================== ðŸ“‚ MULTER STORAGE ===================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.fieldname + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* ===================================================== ðŸ‘¤ USER MODEL ===================================================== */
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

/* ===================================================== ðŸ¡ LAND MODEL ===================================================== */
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
  category: String,        // main category: Land | House | Room | Commercial
  subCategory: String,     // e.g. Agricultural Land, Apartment, Room - Living
  mainCategory: String,
  // Land-specific
  landUse: String,
  roadAccess: String,
  waterSource: String,
  // House/Room-specific
  bedrooms: Number,
  bathrooms: Number,
  furnishing: String,
  floor: String,
  attachedBathroom: String,
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

/* ===================================================== ðŸ“ BOOKING MODEL ===================================================== */
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

/* ===================================================== ðŸ” AUTH ROUTES ===================================================== */
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

/* ===================================================== ðŸ¡ LAND ROUTES ===================================================== */
// Handle multiple files: Main Image + Lalpurja
app.post("/add-land", upload.fields([{ name: "image", maxCount: 1 }, { name: "lalpurja", maxCount: 1 }]), async (req, res) => {
  try {
    // Check seller status â€” existing users without accountType field are treated as sellers
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

/* ===================================================== ðŸ‘‘ ADMIN ROUTES ===================================================== */
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

/* ===================================================== ðŸ¤ BOOKING ROUTES ===================================================== */
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

/* ===================================================== ðŸ” & â¤ï¸ SEARCH/SAVE ===================================================== */
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
        { subCategory: { $regex: q, $options: "i" } },
      ]
    }).limit(8).select("title location city district province category subCategory price image");
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

/* ===================================================== ðŸ’¬ CHAT MODEL & ROUTES ===================================================== */
const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: String,
  readAt: { type: Date, default: null },
  // deleteAt is set to readAt + 60s when message is read â€” TTL index fires on this field
  deleteAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});
// Simple TTL index on deleteAt â€” MongoDB deletes doc when deleteAt <= now
messageSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });
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

// Get messages for a room (and mark unread ones as read â†’ starts 60s delete countdown)
app.get("/chat/messages/:userId/:otherId", async (req, res) => {
  try {
    const { userId, otherId } = req.params;
    const roomId = getRoomId(userId, otherId);
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).limit(100);
    // Set deleteAt = now + 60s for messages sent by the other user that haven't been read yet
    const sixtySecondsFromNow = new Date(Date.now() + 60 * 1000);
    await Message.updateMany(
      { roomId, senderId: otherId, readAt: null },
      { $set: { readAt: new Date(), deleteAt: sixtySecondsFromNow } }
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

/* ===================================================== ðŸ¤– /* ===================================================== 🤖

/* ===================================================== 🤖 AI RENT ADVISOR ===================================================== */
const OpenAI = require("openai");

const SYSTEM_PROMPT = `You are RentBot, an expert AI assistant for ProperEstate - Nepal's premier broker-free rental platform. Be friendly, concise, and helpful like ChatGPT.

NEPAL RENTAL PRICES 2025:
KATHMANDU: Room Rs.6k-18k/mo, 2BHK Rs.18k-50k/mo, 3BHK Rs.30k-80k/mo, Shop(Ring Road) Rs.30k-1.5L/mo, Office Rs.40-150/sqft/mo. Hot: Jhamsikhel,Lazimpat. Affordable: Kirtipur,Balkhu.
POKHARA: Room Rs.5k-12k/mo, 2BHK Rs.15k-35k/mo, Shop(Lakeside) Rs.25k-80k/mo. Prices spike Oct-Feb tourist season.
CHITWAN: Room Rs.4k-9k/mo, 2BHK Rs.10k-22k/mo, Agri Rs.8k-25k/kattha/year.
BUTWAL/BHAIRAHAWA: Room Rs.3.5k-8k/mo, 2BHK Rs.8k-18k/mo.
BIRATNAGAR: Room Rs.4k-10k/mo, 2BHK Rs.10k-22k/mo, Warehouse Rs.10-25/sqft/mo.
BIRGUNJ: Warehouse Rs.8-20/sqft/mo best for import/export.

NEPAL RENTAL LAWS: Bhaada Salaami Patra=rental agreement, 2-3 months advance, ward office registration for leases over 1 year, Malpot for agri land, 15 days eviction notice.

PROPERESTATE PLATFORM: 100% broker-free, buyers pay Rs.5000 eSewa deposit to request, sellers need ID verification, admin approves listings, direct chat with auto-delete messages, live search, wishlist.

HOW TO USE: Search bar top of page, Filters button, Details page to book, Chat with Owner button, sidebar List Property (need seller account), Profile > Become Seller to apply, bell icon for booking requests.

NEPALI TERMS: kotha=room, ghar=house, khet=agri land, pasal=shop, bhada=rent, sasto=cheap, mahango=expensive, aana=342sqft, ropani=5476sqft, kattha=3645sqft.

Keep replies under 200 words. Use emojis naturally. Always suggest next steps.`;

app.post("/ai-advisor", async (req, res) => {
  try {
    const { messages } = req.body;
    const lastMsg = (messages && messages.length) ? messages[messages.length - 1].content : "";
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
      return res.json({ success: true, reply: getFallbackReply(lastMsg) });
    }
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.slice(-10)],
      max_tokens: 300,
      temperature: 0.7,
    });
    res.json({ success: true, reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("AI error:", err.message);
    const lastMsg = (req.body.messages && req.body.messages.length) ? req.body.messages[req.body.messages.length - 1].content : "";
    res.json({ success: true, reply: getFallbackReply(lastMsg) });
  }
});

function getFallbackReply(text) {
  const t = (text || "").toLowerCase().trim();
  if (t.match(/^(hi|hello|hey|namaste|namaskar|yo|sup)/)) return "Namaste! I am RentBot, your Nepal rental expert.\n\nI can help with:\n- Rental prices in any Nepal city\n- Finding the right property type\n- How to use ProperEstate\n- Nepal rental laws and process\n\nWhat are you looking for?";
  if (t.match(/broker|dalal|commission|agent|middleman/)) return "ProperEstate is 100% broker-free!\n\nBrokers in Nepal charge 1-2 months rent as commission. We eliminate that completely - you connect DIRECTLY with property owners.\n\nNo middlemen, no hidden fees!";
  if (t.match(/kathmandu|ktm|lalitpur|bhaktapur|patan|baneshwor|lazimpat|thamel|kirtipur/)) return "Kathmandu rental market 2025:\n\nRoom: Rs.6,000-18,000/mo\n2BHK: Rs.18,000-50,000/mo\nOffice: Rs.40-150/sqft/mo\nShop (Ring Road): Rs.30,000-1.5L/mo\n\nHot areas: Jhamsikhel, Lazimpat, Baluwatar\nAffordable: Kirtipur, Balkhu, Thankot\n\nWhat type of property are you looking for?";
  if (t.match(/pokhara|lakeside|birauta|hemja/)) return "Pokhara rental market 2025:\n\nRoom: Rs.5,000-12,000/mo\n2BHK: Rs.15,000-35,000/mo\nShop (Lakeside): Rs.25,000-80,000/mo\n\nTip: Prices spike Oct-Feb tourist season. Lock in annual contracts!";
  if (t.match(/chitwan|bharatpur|narayanghat/)) return "Chitwan rental market 2025:\n\nRoom: Rs.4,000-9,000/mo\n2BHK: Rs.10,000-22,000/mo\nShop: Rs.15,000-50,000/mo\nAgri land: Rs.8,000-25,000/kattha/year\n\nChitwan is growing fast - great value vs Kathmandu!";
  if (t.match(/butwal|bhairahawa|rupandehi/)) return "Butwal/Bhairahawa rental market:\n\nRoom: Rs.3,500-8,000/mo\n2BHK: Rs.8,000-18,000/mo\nShop (Highway): Rs.10,000-40,000/mo\n\nAirport expansion is driving commercial rents up!";
  if (t.match(/biratnagar|morang|sunsari/)) return "Biratnagar rental market:\n\nRoom: Rs.4,000-10,000/mo\n2BHK: Rs.10,000-22,000/mo\nWarehouse: Rs.10-25/sqft/mo\nShop: Rs.12,000-45,000/mo";
  if (t.match(/room|kotha|1bhk|single/)) return "Single room / 1BHK rentals in Nepal:\n\nKathmandu: Rs.6,000-18,000/mo\nPokhara: Rs.5,000-12,000/mo\nChitwan: Rs.4,000-9,000/mo\nButwal: Rs.3,500-8,000/mo\n\nAlways get a written rental agreement!";
  if (t.match(/flat|apartment|2bhk|3bhk|bhk/)) return "Flat/apartment rentals in Nepal:\n\nKathmandu 2BHK: Rs.18,000-50,000/mo\nPokhara 2BHK: Rs.15,000-35,000/mo\nChitwan 2BHK: Rs.10,000-22,000/mo\nButwal 2BHK: Rs.8,000-18,000/mo\n\nFurnished flats cost 20-40% more!";
  if (t.match(/shop|pasal|commercial|showroom/)) return "Shop/commercial space rentals:\n\nKathmandu Ring Road: Rs.30,000-1.5L/mo\nThamel: Rs.50,000-3L/mo\nPokhara Lakeside: Rs.25,000-80,000/mo\nChitwan Highway: Rs.15,000-50,000/mo\n\nRoad frontage doubles the rent!";
  if (t.match(/office|workspace|cowork/)) return "Office space rentals in Nepal:\n\nKathmandu prime: Rs.60-150/sqft/mo\nKathmandu mid: Rs.40-90/sqft/mo\nPokhara: Rs.30-70/sqft/mo\n\nCo-working spaces start at Rs.5,000/desk/mo!";
  if (t.match(/agri|farm|khet|agricultural/)) return "Agricultural land rent in Nepal:\n\nChitwan/Nawalpur: Rs.8,000-25,000/kattha/year\nRupandehi: Rs.6,000-20,000/kattha/year\nSunsari/Morang: Rs.7,000-22,000/kattha/year\n\nAlways register at local Malpot office!";
  if (t.match(/cheap|sasto|affordable|budget|low/)) return "Most affordable rental cities in Nepal:\n\n1. Butwal/Bhairahawa - rooms from Rs.3,500/mo\n2. Chitwan - rooms from Rs.4,000/mo\n3. Biratnagar - rooms from Rs.4,000/mo\n4. Kathmandu outskirts - from Rs.5,000/mo\n\nWhat is your budget?";
  if (t.match(/post|list|upload|become.*seller/)) return "How to list a property on ProperEstate:\n\n1. Profile > Become a Seller\n2. Upload Citizenship/NID/Passport\n3. Wait for admin approval (24-48hrs)\n4. Click List Property in sidebar\n5. Pay Rs.1,000 platform fee via eSewa\n\nYour listing goes live after admin verification!";
  if (t.match(/how.*rent|how.*book|want.*rent|looking.*rent/)) return "How to rent on ProperEstate:\n\n1. Browse listings on home page\n2. Use filters (location, type, price)\n3. Click Details on any property\n4. Enter rental duration\n5. Click Request to Rent\n6. Pay Rs.5,000 deposit via eSewa\n7. Chat directly with the owner\n\nNo broker fees ever!";
  if (t.match(/chat|message|talk.*owner/)) return "ProperEstate has direct messaging!\n\nTo chat with an owner:\n1. Open any property details page\n2. Click Chat with Owner\n3. Chat window opens instantly\n\nMessages auto-delete 1 minute after being read for privacy!";
  if (t.match(/process|tips|agreement|contract|advance|legal/)) return "Nepal rental process:\n\n1. Find property, visit in person\n2. Negotiate rent + 2-3 months advance\n3. Sign Bhaada Salaami Patra (rental agreement)\n4. Register at ward office if over 1 year\n5. Keep all payment receipts\n\nAlways get a written contract!";
  if (t.match(/price|rate|cost|kati|kitna|how much/)) return "I can give rental prices for any city!\n\nJust tell me:\n- Which city? (Kathmandu, Pokhara, Chitwan...)\n- What type? (room, flat, shop, office...)\n- Your budget range?\n\nI will give you accurate 2025 market rates!";
  const numMatch = t.match(/(\d[\d,]*)/);
  if (numMatch) {
    const num = parseInt(numMatch[1].replace(/,/g, ""));
    if (num < 10000) return "With Rs." + num.toLocaleString() + "/mo budget, you can find rooms in Chitwan, Butwal, or Biratnagar. Kathmandu outskirts also has options. Want specific recommendations?";
    if (num < 30000) return "Rs." + num.toLocaleString() + "/mo is a solid budget! You can get a comfortable 2BHK in Pokhara, Chitwan, or Kathmandu mid-areas. Which city interests you?";
    return "Rs." + num.toLocaleString() + "/mo gives you access to premium properties! You can get a furnished 3BHK in Kathmandu or commercial space in prime locations. What type of property?";
  }
  return "I am here to help with Nepal rentals!\n\nAsk me about:\n- Rental prices in any Nepal city\n- Finding the right property type\n- How to use ProperEstate\n- Nepal rental laws and process\n\nWhat would you like to know?";
}



/* ===================================================== HELP CENTER ===================================================== */
app.post("/help-center", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await sendHelpCenterEmail(name, email, message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===================================================== 🤝 RENTAL PARTNER ===================================================== */
const rentalPartnerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  location: { type: String, required: true },
  budget: { type: Number, required: true },
  propertyType: { type: String, required: true },
  subCategory: { type: String, required: true },
  preferredGender: { type: String, default: "" },
  preferredAge: { type: String, default: "" },
  moveInDate: { type: String, default: "" },
  description: { type: String, default: "" },
  paymentStatus: { type: String, default: "paid" },
  createdAt: { type: Date, default: Date.now },
});
const RentalPartner = mongoose.model("RentalPartner", rentalPartnerSchema);

app.post("/rental-partner", async (req, res) => {
  try {
    const partner = new RentalPartner(req.body);
    await partner.save();
    res.json({ success: true, partner });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/rental-partners", async (req, res) => {
  try {
    const partners = await RentalPartner.find()
      .populate("userId", "name avatar _id")
      .sort({ createdAt: -1 });
    res.json({ success: true, partners });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});