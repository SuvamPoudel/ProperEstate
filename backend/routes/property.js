const express = require("express");
const router = express.Router();

const { User, Land, Notification, upload } = require("../server");

/* =====================================================
    1️⃣ SELLER: Add Land with Lalpurja (needs admin approval)
   ===================================================== */
router.post("/add", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "lalpurja", maxCount: 1 }
]), async (req, res) => {
  try {
    const landData = req.body;
    if (req.files?.lalpurja?.[0]) landData.lalpurja = req.files.lalpurja[0].filename;
    landData.lalpurjaApproved = false; // must be approved by admin
    if (req.files?.image?.[0]) landData.image = req.files.image[0].filename;

    const land = new Land(landData);
    await land.save();
    res.json({ success: true, message: "Land submitted. Waiting for admin approval of Lalpurja." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
    2️⃣ ADMIN: Approve Lalpurja
   ===================================================== */
router.post("/admin/approve-lalpurja/:id", async (req, res) => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) return res.status(404).json({ success: false, message: "Land not found" });
    land.lalpurjaApproved = true;
    await land.save();
    res.json({ success: true, message: "Lalpurja approved. Land now visible." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
    3️⃣ BUYER: Request Land
   ===================================================== */
router.post("/request/:landId", async (req, res) => {
  try {
    const { buyerId } = req.body;
    const land = await Land.findById(req.params.landId);
    if (!land) return res.status(404).json({ success: false, message: "Land not found" });

    const notification = new Notification({
      type: "request",
      senderId: buyerId,
      receiverId: land.ownerId,
      landId: land._id,
      message: `Buyer wants to request your property: ${land.title}`,
    });
    await notification.save();

    res.json({ success: true, message: "Request sent to seller." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
    4️⃣ SELLER: Approve Buyer Request
   ===================================================== */
router.post("/approve-request/:notificationId", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);
    if (!notification) return res.status(404).json({ success: false });

    notification.type = "approval";
    notification.message += " ✅ Approved by seller.";
    await notification.save();

    // create dummy eSewa commission notification
    const paymentNotification = new Notification({
      type: "payment",
      senderId: notification.receiverId, // seller
      receiverId: notification.senderId, // buyer
      landId: notification.landId,
      message: "Pay Rs 500 commission to ProperEstate (dummy payment).",
    });
    await paymentNotification.save();

    res.json({ success: true, message: "Buyer request approved and payment notification sent." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
    5️⃣ GET NOTIFICATIONS FOR USER
   ===================================================== */
router.get("/notifications/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({ receiverId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;