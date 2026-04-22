const mongoose = require("mongoose");
const upload = require("../config/multer");

// Message Schema
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, default: "" },
  image: { type: String, default: null }, // filename in uploads/
  read: { type: Boolean, default: false },
  deleteAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// Send Message (text or image)
const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!senderId || !receiverId || (!text && !image)) {
      return res.status(400).json({ success: false, message: "Message or image required" });
    }

    const message = new Message({ senderId, receiverId, text: text || "", image });
    await message.save();

    res.json({ success: true, message: "Message sent", data: message });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Messages for a Room
const getMessages = async (req, res) => {
  try {
    const { userId, otherId } = req.params;

    // Get messages between two users
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherId },
        { senderId: otherId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });

    // Mark unread messages as read and set delete timer
    await Message.updateMany(
      {
        senderId: otherId,
        receiverId: userId,
        read: false
      },
      {
        read: true,
        deleteAt: new Date(Date.now() + 60000) // 60 seconds from now
      }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Conversations List
const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: new mongoose.Types.ObjectId(userId) }, { receiverId: new mongoose.Types.ObjectId(userId) }]
        }
      },
      {
        $addFields: {
          partnerId: {
            $cond: {
              if: { $eq: ["$senderId", new mongoose.Types.ObjectId(userId)] },
              then: "$receiverId",
              else: "$senderId"
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$partnerId",
          lastMessage: { $first: "$text" },
          lastMessageTime: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)] },
                    { $eq: ["$read", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "partner"
        }
      },
      {
        $unwind: "$partner"
      },
      {
        $project: {
          partnerId: "$_id",
          partnerName: "$partner.name",
          partnerAvatar: "$partner.avatar",
          lastMessage: 1,
          lastMessageTime: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    res.json({ success: true, conversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Unread Count
const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await Message.countDocuments({
      receiverId: new mongoose.Types.ObjectId(userId),
      read: false
    });

    res.json({ success: true, count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Cleanup expired messages (should be run periodically)
const cleanupExpiredMessages = async () => {
  try {
    const result = await Message.deleteMany({
      deleteAt: { $lte: new Date() }
    });
    console.log(`Cleaned up ${result.deletedCount} expired messages`);
  } catch (error) {
    console.error("Cleanup error:", error);
  }
};

// Run cleanup every minute
setInterval(cleanupExpiredMessages, 60000);

module.exports = {
  Message,
  upload,
  sendMessage,
  getMessages,
  getConversations,
  getUnreadCount,
  cleanupExpiredMessages
};