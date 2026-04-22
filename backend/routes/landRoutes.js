const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const landController = require("../controllers/landController");

router.post("/add-land", upload.fields([{ name: "media", maxCount: 6 }, { name: "lalpurja", maxCount: 1 }]), landController.addLand);
router.get("/lands", landController.getAllLands);
router.get("/land/:id", landController.getLandById);
router.put("/edit-land/:id", upload.single("image"), landController.editLand);
router.get("/search-live", landController.searchLands);
router.post("/toggle-save", landController.toggleSaveLand);
router.get("/user-dashboard/:userId", landController.getUserDashboard);

module.exports = router;
