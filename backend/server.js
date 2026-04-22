const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/database");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Connect to MongoDB
connectDB();

// Routes
app.use("/", require("./routes/authRoutes"));
app.use("/", require("./routes/landRoutes"));
app.use("/", require("./routes/adminRoutes"));
app.use("/", require("./routes/bookingRoutes"));
app.use("/", require("./routes/chatRoutes"));
app.use("/", require("./routes/communityRoutes"));
app.use("/", require("./routes/aiRoutes"));
app.use("/", require("./routes/helpRoutes"));
app.use("/", require("./routes/seedRoutes"));
app.use("/", require("./routes/buildRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
