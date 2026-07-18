const express = require("express");
const { protect } = require("../middelwares/authMiddleware");
const {
  nearbyPlacesController,
  getPlaceReviewsController,
  createPlaceReviewController,
} = require("../controllers/placesController");

const router = express.Router();
router.post("/nearby", nearbyPlacesController);
router.get("/reviews", getPlaceReviewsController);
router.post("/reviews", protect, createPlaceReviewController);

module.exports = router;
