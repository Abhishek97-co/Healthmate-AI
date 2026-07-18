const express = require("express");
const { protect } = require("../middelwares/authMiddleware");
const {
  chatbotController,
  getChatHistoryController,
  getChatSessionController,
  deleteChatSessionController,
} = require("../controllers/openaiController.js");

const router = express.Router();

// routes
router.post("/chatbot", chatbotController);
router.get("/history", protect, getChatHistoryController);
router.get("/chat/:id", protect, getChatSessionController);
router.delete("/chat/:id", protect, deleteChatSessionController);

module.exports = router;
