const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

router.post("/ai-advisor", aiController.aiAdvisor);

module.exports = router;
