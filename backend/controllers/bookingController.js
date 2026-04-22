const mongoose = require("mongoose");
const { sendBookingRequestEmail, sendBookingResponseEmail } = require("../emailService");

// Booking Schema
const bookingSchema = new mongoose.Schema({
  landId: { type: mongoose.Schema.Types.ObjectId, ref: "Land", required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  paymentAmount: { type: Number, required: true },
  rentDuration: String,
  rentDurationMonths: Number,
  negotiatedPrice: Number,
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model("Booking", bookingSchema);

// Create Booking Request
const createBooking = async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();

    // Populate references for email
    await booking.populate("landId");
    await booking.populate("buyerId");

    // Send email to seller
    await sendBookingRequestEmail(
      booking.landId.ownerEmail,
      booking.buyerId.name,
      booking.landId.title,
      booking.rentDuration
    );

    res.json({
      success: true,
      message: "Booking request sent successfully",
      booking
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ success: false, message: "Server error during booking" });
  }
};

// Get Seller Bookings
const getSellerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ sellerId: req.params.userId })
      .populate("landId")
      .populate("buyerId")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Respond to Booking
const respondToBooking = async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    ).populate("landId").populate("buyerId");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Send email to buyer
    await sendBookingResponseEmail(
      booking.buyerId.email,
      booking.buyerId.name,
      booking.landId.title,
      status
    );

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      booking
    });
  } catch (error) {
    console.error("Respond to booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  Booking,
  createBooking,
  getSellerBookings,
  respondToBooking
};