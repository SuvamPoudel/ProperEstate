const express = require("express");
const router = express.Router();

router.post("/add", (req, res) => {
  res.json({
    message: "Land route working",
    data: req.body
  });
});

module.exports = router;
