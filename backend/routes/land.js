const express = require("express");
const multer = require("multer");
const Land = require("../models/Land");

const router = express.Router();

// image storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ADD LAND
router.post("/add", upload.single("image"), async (req, res) => {
  const { title, location, price, ownerName, ownerPhone } = req.body;

  const land = new Land({
    title,
    location,
    price,
    ownerName,
    ownerPhone,
    image: req.file.filename
  });

  await land.save();
  res.json({ message: "Land added successfully" });
});

// GET ALL LANDS
router.get("/", async (req, res) => {
  const lands = await Land.find();
  res.json(lands);
});

module.exports = router;
