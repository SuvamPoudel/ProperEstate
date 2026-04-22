const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
};

// Middleware to check if user is seller
const requireSeller = (req, res, next) => {
  if (req.user && (req.user.accountType === "seller" || req.user.role === "admin")) {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Seller account required" });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireSeller
};