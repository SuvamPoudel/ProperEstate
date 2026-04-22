const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const adminController = require("../controllers/adminController");

router.get("/admin/users", adminController.getAllUsers);
router.post("/admin/verify-seller/:id", adminController.verifySeller);
router.post("/admin/set-account-type/:id", adminController.setAccountType);
router.get("/admin/all-lands", adminController.getAllLandsAdmin);
router.post("/admin/verify-land/:id", adminController.verifyLand);
router.delete("/admin/delete-land/:id", adminController.deleteLand);
router.delete("/admin/delete-user/:id", adminController.deleteUser);
router.post("/admin/background-media", upload.single("media"), adminController.uploadBackgroundMedia);
router.get("/admin/background-media", adminController.getBackgroundMedia);
router.put("/admin/background-media/:id", adminController.updateBackgroundMedia);
router.delete("/admin/background-media/:id", adminController.deleteBackgroundMedia);
router.get("/background-media", adminController.getActiveBackgroundMedia);

module.exports = router;
