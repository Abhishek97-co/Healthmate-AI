const express = require("express");
const { environmentController } = require("../controllers/environmentController");

const router = express.Router();
router.get("/data", environmentController);

module.exports = router;
