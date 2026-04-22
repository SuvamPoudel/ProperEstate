const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const authController = require("../controllers/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/update-profile", upload.single("avatar"), authController.updateProfile);
router.post("/become-seller", upload.single("sellerDoc"), authController.becomeSeller);
router.get("/user/:id", authController.getUserInfo);

module.exports = router;
