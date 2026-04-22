const { sendHelpCenterEmail } = require("../emailService");

const helpCenter = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await sendHelpCenterEmail(name, email, message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { helpCenter };
