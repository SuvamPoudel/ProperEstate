const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || "your-secret-key", 
    { expiresIn: "7d" }
  );
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Nepal format)
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// Generate random string
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format price for display
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0
  }).format(price);
};

// Sanitize filename
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  isValidEmail,
  isValidPhone,
  generateRandomString,
  formatPrice,
  sanitizeFilename
};