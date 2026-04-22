const express = require("express");
const router = express.Router();
const helpController = require("../controllers/helpController");

router.post("/help-center", helpController.helpCenter);

module.exports = router;
