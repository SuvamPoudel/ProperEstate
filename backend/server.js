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
const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: String,
  readAt: { type: Date, default: null },
  // deleteAt is set to readAt + 60s when message is read — TTL index fires on this field
  deleteAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});
// Simple TTL index on deleteAt — MongoDB deletes doc when deleteAt <= now
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

// Get messages for a room (and mark unread ones as read → starts 60s delete countdown)
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

/* ===================================================== 🤖 AI RENT ADVISOR ===================================================== */
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are RentBot, an expert AI assistant for ProperEstate — Nepal's premier broker-free rental platform. You are friendly, knowledgeable, and conversational like ChatGPT.

CORE IDENTITY:
- You are a Nepal real estate expert with deep knowledge of the rental market
- You understand Nepali culture, language (Nepali-English mix is fine), and local context
- You are helpful, warm, and concise — keep replies under 200 words unless detailed info is needed
- Use emojis naturally but not excessively
- Always end with a helpful follow-up or suggestion

NEPAL RENTAL MARKET KNOWLEDGE (2025):

KATHMANDU VALLEY:
- Single room: Rs.6,000-18,000/mo (Kirtipur/Balkhu cheap; Lazimpat/Maharajgunj expensive)
- 1BHK: Rs.10,000-25,000/mo
- 2BHK: Rs.18,000-50,000/mo | 3BHK: Rs.30,000-80,000/mo
- Furnished adds 20-40% premium
- Shop (Ring Road): Rs.30,000-1.5L/mo | Shop (Thamel): Rs.50,000-3L/mo
- Office: Rs.40-150/sqft/mo | Co-working: Rs.5,000-15,000/desk/mo
- Hot areas: Jhamsikhel, Lazimpat, Baluwatar, Baneshwor, Koteshwor
- Affordable: Kirtipur, Balkhu, Thankot, Bhaktapur outskirts
- Trend: 12% price increase from 2024, demand exceeds supply

POKHARA:
- Room: Rs.5,000-12,000/mo | 2BHK: Rs.15,000-35,000/mo
- Shop (Lakeside): Rs.25,000-80,000/mo
- Hot: Lakeside, Birauta, Newroad | Affordable: Hemja, Lekhnath
- Tip: Prices spike Oct-Feb (tourist season), lock annual contracts

CHITWAN (Bharatpur):
- Room: Rs.4,000-9,000/mo | 2BHK: Rs.10,000-22,000/mo
- Shop (Narayanghat): Rs.15,000-50,000/mo
- Agricultural: Rs.8,000-25,000/kattha/year
- Growing fast, great value vs Kathmandu

BUTWAL / BHAIRAHAWA:
- Room: Rs.3,500-8,000/mo | 2BHK: Rs.8,000-18,000/mo
- Shop (Highway): Rs.10,000-40,000/mo
- Airport expansion driving commercial rent up

BIRATNAGAR:
- Room: Rs.4,000-10,000/mo | 2BHK: Rs.10,000-22,000/mo
- Warehouse: Rs.10-25/sqft/mo | Shop: Rs.12,000-45,000/mo
- Industrial zone best for warehouses

BIRGUNJ (India border):
- Warehouse: Rs.8-20/sqft/mo (best for import/export)
- Shop: Rs.15,000-60,000/mo

DHARAN, HETAUDA, NEPALGUNJ, DHANGADHI:
- Room: Rs.3,000-8,000/mo | 2BHK: Rs.7,000-18,000/mo
- Commercial varies by location

AGRICULTURAL LAND RENT:
- Chitwan/Nawalpur: Rs.8,000-25,000/kattha/year
- Rupandehi/Kapilvastu: Rs.6,000-20,000/kattha/year
- Sunsari/Morang: Rs.7,000-22,000/kattha/year
- Kailali/Kanchanpur: Rs.4,000-15,000/kattha/year

NEPAL RENTAL LAWS & PROCESS:
- Bhaada Salaami Patra = rental agreement (must have)
- Advance: usually 2-3 months rent upfront
- Ward office registration required for leases >1 year
- Malpot (land revenue office) for agricultural land
- Tenant rights: 15 days notice for eviction, advance is refundable
- Landlord rights: can evict for non-payment after 35 days
- No formal rent control law in Nepal currently

PROPERESTATE PLATFORM:
- 100% broker-free — direct owner to renter, no commission
- Buyers: browse → request to rent → pay Rs.5,000 eSewa deposit → chat with owner
- Sellers: verify identity (citizenship/NID/passport) → admin approves → list property → pay Rs.1,000 platform fee
- Admin approves all listings before they go live
- Direct chat between buyer and seller (messages auto-delete 1 min after reading for privacy)
- Live search by city, district, province, category
- Save properties to wishlist
- Booking requests with rental duration

HOW TO USE THE WEBSITE:
- Search: top search bar, type city/area/type, live suggestions appear
- Filter: click Filters button, set location/type/price range
- Book: Details page → enter duration → Request to Rent → eSewa payment
- Chat: Details page → Chat with Owner button, or chat icon in navbar
- List property: sidebar → List Property (need seller account first)
- Become seller: Profile → Become a Seller → upload ID → wait for approval
- Booking requests: bell icon in navbar → see all incoming requests
- Edit listing: Dashboard → My Listed Assets → Edit button

LANGUAGE: Understand and respond to Nepali-English mix. Common terms:
- kotha/kotha = room | ghar = house | khet = agricultural land | pasal = shop
- bhada/bhaada = rent | sasto = cheap | mahango = expensive | ramro = good
- Kathmandu = KTM | Pokhara = PKR | aana = unit of land (342 sqft)
- ropani = 5476 sqft | kattha = 3645 sqft (Terai) | bigha = 72,900 sqft

Always be helpful, accurate, and guide users toward finding their perfect rental on ProperEstate!`;

app.post("/ai-advisor", async (req, res) => {
  try {
    const { messages } = req.body; // array of {role, content}
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_api_key_here") {
      // Fallback if no API key — smart rule-based response
      return res.json({ success: true, reply: getFallbackReply(messages[messages.length - 1]?.content || "") });
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.slice(-10)],
      max_tokens: 300,
      temperature: 0.7,
    });
    res.json({ success: true, reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("AI error:", err.message);
    // Fallback on API error
    const lastMsg = req.body.messages?.[req.body.messages.length - 1]?.content || "";
    res.json({ success: true, reply: getFallbackReply(lastMsg) });
  }
});

function getFallbackReply(text) {
  const t = text.toLowerCase().trim();

  // Greetings
  if (t.match(/^(hi|hello|hey|namaste|namaskar|yo|sup|hola|good\s*(morning|evening|afternoon))/))
    return "Namaste! 🙏 I'm RentBot, your Nepal rental expert.\n\nI can help you with:\n• Rental prices in any Nepal city\n• Finding the right property type\n• How to use ProperEstate\n• Nepal rental laws & process\n\nWhat are you looking for?";

  // Broker
  if (t.match(/broker|dalal|commission|agent|middleman/))
    return "ProperEstate is 100% broker-free! 🎉\n\nBrokers in Nepal charge 1-2 months rent as commission. We eliminate that completely — you connect DIRECTLY with property owners.\n\nNo middlemen, no hidden fees, no broker drama!";

  // Kathmandu
  if (t.match(/kathmandu|ktm|lalitpur|bhaktapur|patan|baneshwor|lazimpat|thamel|kirtipur/))
    return "Kathmandu rental market 2025 📊\n\n🏠 Room: Rs.6,000-18,000/mo\n🏡 2BHK: Rs.18,000-50,000/mo\n🏢 Office: Rs.40-150/sqft/mo\n🏪 Shop (Ring Road): Rs.30,000-1.5L/mo\n\n🔥 Hot: Jhamsikhel, Lazimpat, Baluwatar\n💚 Affordable: Kirtipur, Balkhu, Thankot\n\nWhat type of property are you looking for?";

  // Pokhara
  if (t.match(/pokhara|lakeside|birauta|hemja|lekhnath/))
    return "Pokhara rental market 2025 🌄\n\n🏠 Room: Rs.5,000-12,000/mo\n🏡 2BHK: Rs.15,000-35,000/mo\n🏪 Shop (Lakeside): Rs.25,000-80,000/mo\n\n💡 Tip: Prices spike Oct-Feb (tourist season). Lock in annual contracts for better rates!";

  // Chitwan
  if (t.match(/chitwan|bharatpur|narayanghat/))
    return "Chitwan rental market 2025 🌿\n\n🏠 Room: Rs.4,000-9,000/mo\n🏡 2BHK: Rs.10,000-22,000/mo\n🏪 Shop: Rs.15,000-50,000/mo\n🌾 Agri land: Rs.8,000-25,000/kattha/year\n\nChitwan is growing fast — great value vs Kathmandu!";

  // Butwal/Bhairahawa
  if (t.match(/butwal|bhairahawa|rupandehi/))
    return "Butwal/Bhairahawa rental market 🏘️\n\n🏠 Room: Rs.3,500-8,000/mo\n🏡 2BHK: Rs.8,000-18,000/mo\n🏪 Shop (Highway): Rs.10,000-40,000/mo\n\n💡 Airport expansion is driving commercial rents up — good time to lock in long-term leases!";

  // Biratnagar
  if (t.match(/biratnagar|morang|sunsari|itahari/))
    return "Biratnagar rental market 🏭\n\n🏠 Room: Rs.4,000-10,000/mo\n🏡 2BHK: Rs.10,000-22,000/mo\n🏭 Warehouse: Rs.10-25/sqft/mo\n🏪 Shop: Rs.12,000-45,000/mo\n\nIndustrial zone has affordable warehouse space — great for businesses!";

  // Room/1BHK
  if (t.match(/room|kotha|1bhk|single|hostel|pg/))
    return "Single room / 1BHK rentals in Nepal 🛏️\n\nKathmandu: Rs.6,000-18,000/mo\nPokhara: Rs.5,000-12,000/mo\nChitwan: Rs.4,000-9,000/mo\nButwal: Rs.3,500-8,000/mo\n\n💡 Rooms near colleges/hospitals rent faster. Always get a written agreement!";

  // Flat/apartment
  if (t.match(/flat|apartment|2bhk|3bhk|bhk|floor/))
    return "Flat/apartment rentals in Nepal 🏡\n\nKathmandu 2BHK: Rs.18,000-50,000/mo\nPokhara 2BHK: Rs.15,000-35,000/mo\nChitwan 2BHK: Rs.10,000-22,000/mo\nButwal 2BHK: Rs.8,000-18,000/mo\n\n💡 Furnished flats cost 20-40% more. Check water supply and parking!";

  // Shop/commercial
  if (t.match(/shop|pasal|showroom|commercial|store|retail/))
    return "Shop/commercial space rentals 🏪\n\nKathmandu Ring Road: Rs.30,000-1.5L/mo\nThamel: Rs.50,000-3L/mo\nPokhara Lakeside: Rs.25,000-80,000/mo\nChitwan Highway: Rs.15,000-50,000/mo\n\n💡 Road frontage doubles the rent. Check footfall before signing!";

  // Office
  if (t.match(/office|workspace|cowork/))
    return "Office space rentals in Nepal 🏢\n\nKathmandu prime (Durbarmarg, Hattisar): Rs.60-150/sqft/mo\nKathmandu mid (Pulchowk, Jhamsikhel): Rs.40-90/sqft/mo\nPokhara: Rs.30-70/sqft/mo\n\n💡 Co-working spaces in Kathmandu start at Rs.5,000/desk/mo — great for startups!";

  // Agricultural
  if (t.match(/agri|farm|khet|agricultural|land|plot/))
    return "Agricultural land rent in Nepal 🌾\n\nChitwan/Nawalpur: Rs.8,000-25,000/kattha/year\nRupandehi/Kapilvastu: Rs.6,000-20,000/kattha/year\nSunsari/Morang: Rs.7,000-22,000/kattha/year\nKailali/Kanchanpur: Rs.4,000-15,000/kattha/year\n\n💡 Always register at local Malpot office for legal protection!";

  // Cheap/affordable
  if (t.match(/cheap|sasto|affordable|budget|low|under|less/))
    return "Most affordable rental cities in Nepal 💚\n\n1. Butwal/Bhairahawa — rooms from Rs.3,500/mo\n2. Chitwan — rooms from Rs.4,000/mo\n3. Biratnagar — rooms from Rs.4,000/mo\n4. Kathmandu outskirts (Kirtipur) — from Rs.5,000/mo\n\nWhat's your budget? I can suggest the best options!";

  // How to post/list
  if (t.match(/post|list|upload|add.*property|create.*listing|how.*sell|want.*list/))
    return "How to list a property on ProperEstate 📋\n\n1. Go to Profile → Become a Seller\n2. Upload Citizenship/NID/Passport\n3. Wait for admin approval (24-48hrs)\n4. Click 'List Property' in sidebar\n5. Fill in all details + upload photos\n6. Pay Rs.1,000 platform fee via eSewa\n7. Admin verifies → goes live!\n\nNeed help with any step?";

  // How to rent/book
  if (t.match(/how.*rent|how.*book|request|want.*rent|looking.*rent|need.*place/))
    return "How to rent a property on ProperEstate 🏠\n\n1. Browse listings on home page\n2. Use filters (location, type, price)\n3. Click 'Details' on any property\n4. Enter rental duration\n5. Click 'Request to Rent'\n6. Pay Rs.5,000 security deposit via eSewa\n7. Chat directly with the owner 💬\n\nNo broker fees — ever! What type of property are you looking for?";

  // Chat feature
  if (t.match(/chat|message|talk.*owner|contact.*owner/))
    return "ProperEstate has direct messaging! 💬\n\nTo chat with a property owner:\n1. Open any property details page\n2. Click 'Chat with Owner'\n3. Chat window opens instantly\n\nYou can also access all chats via the chat icon in the navbar.\n\n🔒 Privacy: Messages auto-delete 1 minute after being read!";

  // Process/tips/agreement
  if (t.match(/process|tips|agreement|contract|advance|deposit|malpot|ward|legal/))
    return "Nepal rental process & tips 📋\n\n1. Find property → visit in person\n2. Negotiate rent + advance (2-3 months)\n3. Sign Bhaada Salaami Patra (rental agreement)\n4. Register at ward office if >1 year\n5. Keep all payment receipts\n\n⚠️ Always get a written contract. Clarify who pays electricity/water. Check for hidden charges!";

  // Price inquiry
  if (t.match(/price|rate|cost|kati|kitna|how much|monthly|per month/))
    return "I can give you rental prices for any city or property type! 💰\n\nJust tell me:\n• Which city? (Kathmandu, Pokhara, Chitwan...)\n• What type? (room, flat, shop, office...)\n• Your budget range?\n\nI'll give you accurate 2025 market rates!";

  // Comparison/recommendation
  if (t.match(/best|better|compare|which.*city|which.*area|recommend|suggest/))
    return "Best cities for renting in Nepal 🗺️\n\n🏆 Best value: Pokhara (growing, lower than KTM)\n💼 Best for work: Kathmandu (most jobs, connectivity)\n💚 Most affordable: Chitwan, Butwal\n🏭 Best for business: Birgunj, Biratnagar\n🌿 Best lifestyle: Pokhara, Chitwan\n\nWhat's your priority — work, lifestyle, or budget?";

  // Number in message (budget)
  const numMatch = t.match(/(\d[\d,]*)/);
  if (numMatch) {
    const num = parseInt(numMatch[1].replace(/,/g, ""));
    if (num < 10000) return `With Rs.${num.toLocaleString()}/mo budget, you can find rooms in Chitwan, Butwal, or Biratnagar. Kathmandu outskirts (Kirtipur) also has options in this range. Want specific recommendations?`;
    if (num < 30000) return `Rs.${num.toLocaleString()}/mo is a solid budget! You can get a comfortable 2BHK in Pokhara, Chitwan, or Kathmandu mid-areas. Want me to narrow it down by city?`;
    return `Rs.${num.toLocaleString()}/mo gives you access to premium properties! You can get a furnished 3BHK in Kathmandu or commercial space in prime locations. What type of property are you looking for?`;
  }

  return "I'm here to help with Nepal rentals! 🏠\n\nAsk me about:\n• Rental prices in any Nepal city\n• Finding the right property type\n• How to use ProperEstate\n• Nepal rental laws & process\n• Comparing cities and areas\n\nWhat would you like to know?";
}

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