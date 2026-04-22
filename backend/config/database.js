const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error("❌ MONGODB_URI not set in .env file");
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI, { 
      serverSelectionTimeoutMS: 30000 
    });
    console.log("✅ MongoDB Atlas Connected Successfully!");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;