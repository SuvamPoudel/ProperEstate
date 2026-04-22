const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

router.post("/book-land", bookingController.createBooking);
router.get("/seller/bookings/:userId", bookingController.getSellerBookings);
router.post("/seller/respond-booking/:id", bookingController.respondToBooking);

module.exports = router;
