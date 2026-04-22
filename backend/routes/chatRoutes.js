const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// send supports optional image upload
router.post("/chat/send", chatController.upload.single("image"), chatController.sendMessage);
router.get("/chat/messages/:userId/:otherId", chatController.getMessages);
router.get("/chat/conversations/:userId", chatController.getConversations);
router.get("/chat/unread/:userId", chatController.getUnreadCount);

module.exports = router;
