const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const upload = require("../config/multer");

router.post("/rental-partner", communityController.createRentalPartner);
router.get("/rental-partners", communityController.getRentalPartners);
router.post("/buyer-posts", upload.array("media", 4), communityController.createBuyerPost);
router.get("/buyer-posts", communityController.getBuyerPosts);
router.post("/buyer-posts/:id/comment", communityController.addBuyerPostComment);
router.post("/buyer-posts/:id/like", communityController.toggleBuyerPostLike);

module.exports = router;
