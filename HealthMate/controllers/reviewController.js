const Review = require("../models/reviewModel");

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(50);
    return res.status(200).json({ reviews });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch reviews." });
  }
};

exports.createReview = async (req, res) => {
  const { username, rating, title, experience, category } = req.body;

  if (!username?.trim() || !title?.trim() || !experience?.trim()) {
    return res.status(400).json({ error: "Username, title, and experience are required." });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5." });
  }

  try {
    const review = await Review.create({ username, rating, title, experience, category });
    return res.status(201).json({ review });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save review." });
  }
};
