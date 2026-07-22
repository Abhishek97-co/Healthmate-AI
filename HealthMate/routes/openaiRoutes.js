const express = require("express");
const { protect } = require("../middelwares/authMiddleware");
const {
  chatbotController,
  getChatHistoryController,
  getChatSessionController,
  deleteChatSessionController,
  scanMealController,
} = require("../controllers/openaiController.js");

const router = express.Router();

router.post("/chatbot", chatbotController);
router.post("/scan-meal", protect, scanMealController);
router.get("/history", protect, getChatHistoryController);
router.get("/chat/:id", protect, getChatSessionController);
router.delete("/chat/:id", protect, deleteChatSessionController);

module.exports = router;
