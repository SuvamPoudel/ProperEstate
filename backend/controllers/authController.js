const User = require("../models/User");
const { hashPassword, comparePassword, generateToken, isValidEmail, isValidPhone } = require("../utils/helpers");
const { sendLandApprovalEmail } = require("../emailService");

// User Signup
const signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ success: false, message: "Phone must be 10 digits" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountType: user.accountType
      },
      token
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ success: false, message: "Server error during signup" });
  }
};

// User Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Check password
    let isPasswordValid = false;
    try {
      isPasswordValid = await comparePassword(password, user.password);
    } catch (err) {
      // ignore potential bcrypt errors with plaintext
    }

    // Fallback for older accounts with plaintext passwords
    if (!isPasswordValid && password === user.password) {
      isPasswordValid = true;
      // Auto-migrate: Hash the plaintext password and save it
      user.password = await hashPassword(password);
      await user.save();
    }

    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountType: user.accountType,
        avatar: user.avatar,
        savedLands: user.savedLands
      },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) {
      if (!isValidPhone(phone)) {
        return res.status(400).json({ success: false, message: "Phone must be 10 digits" });
      }
      updateData.phone = phone;
    }
    if (req.file) updateData.avatar = req.file.filename;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountType: user.accountType,
        avatar: user.avatar,
        savedLands: user.savedLands
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Server error during profile update" });
  }
};

// Become Seller
const becomeSeller = async (req, res) => {
  try {
    const { userId, sellerDocType } = req.body;

    if (!userId || !sellerDocType || !req.file) {
      return res.status(400).json({ success: false, message: "All fields and document are required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        accountType: "seller_pending",
        sellerDocType,
        sellerDoc: req.file.filename,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Seller verification submitted successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountType: user.accountType,
        avatar: user.avatar,
        savedLands: user.savedLands
      }
    });
  } catch (error) {
    console.error("Become seller error:", error);
    res.status(500).json({ success: false, message: "Server error during seller verification" });
  }
};

// Get User Info (for chat)
const getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name avatar email");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Get user info error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  signup,
  login,
  updateProfile,
  becomeSeller,
  getUserInfo
};