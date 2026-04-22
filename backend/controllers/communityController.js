const mongoose = require("mongoose");
const upload = require("../config/multer");

/* ===== RENTAL PARTNER SCHEMA ===== */
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

/* ===== BUYER POST SCHEMA ===== */
const buyerPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  userName: String,
  userAvatar: String,
  title: { type: String, required: true }, // serves as status text / content
  postType: { type: String, enum: ["forum", "section"], default: "section" },
  description: { type: String, default: "" },
  propertyType: { type: String, default: "" },
  subCategory: { type: String, default: "" },
  location: { type: String, default: "" },
  budget: { type: Number, default: null },
  contactPhone: { type: String, default: "" },
  contactEmail: { type: String, default: "" },
  media: [{ type: String }], // uploaded filenames
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: String,
    userAvatar: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});
const BuyerPost = mongoose.model("BuyerPost", buyerPostSchema);

/* ===== RENTAL PARTNER CONTROLLERS ===== */
const createRentalPartner = async (req, res) => {
  try {
    const partner = new RentalPartner(req.body);
    await partner.save();
    res.json({ success: true, partner });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getRentalPartners = async (req, res) => {
  try {
    const partners = await RentalPartner.find()
      .populate("userId", "name avatar _id")
      .sort({ createdAt: -1 });
    res.json({ success: true, partners });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ===== BUYER POST CONTROLLERS ===== */
const createBuyerPost = async (req, res) => {
  try {
    const mediaFiles = req.files ? req.files.map(f => f.filename) : [];
    const postData = { ...req.body, media: mediaFiles };
    if (postData.budget) postData.budget = Number(postData.budget);
    const post = new BuyerPost(postData);
    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getBuyerPosts = async (req, res) => {
  try {
    const { sort = "new", postType } = req.query;
    const sortObj = sort === "top" ? { likesCount: -1, createdAt: -1 } : { createdAt: -1 };
    const matchObj = postType ? { postType } : {};

    const posts = await BuyerPost.aggregate([
      { $match: matchObj },
      { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
      { $sort: sortObj },
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "userInfo" } },
      { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
    ]);

    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const addBuyerPostComment = async (req, res) => {
  try {
    const post = await BuyerPost.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: req.body } },
      { new: true }
    );
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const toggleBuyerPostLike = async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await BuyerPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const likes = (post.likes || []).map(id => id.toString());
    const alreadyLiked = likes.includes(userId.toString());

    const update = alreadyLiked
      ? { $pull: { likes: new mongoose.Types.ObjectId(userId) } }
      : { $addToSet: { likes: new mongoose.Types.ObjectId(userId) } };

    const updated = await BuyerPost.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, likes: updated.likes, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  createRentalPartner,
  getRentalPartners,
  createBuyerPost,
  getBuyerPosts,
  addBuyerPostComment,
  toggleBuyerPostLike,
  upload,
};
