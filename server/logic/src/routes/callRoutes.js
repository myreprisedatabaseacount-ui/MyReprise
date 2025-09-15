const express = require("express");
const { authenticateToken } = require("../middleware/auth.js");
const { getStreamToken } = require("../controllers/callController.js");

const router = express.Router();

router.get("/token", authenticateToken, getStreamToken);

module.exports = router;
