const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    experience: { type: String, required: true, trim: true, maxlength: 1000 },
    category: {
      type: String,
      enum: ["chatbot", "diet-plan", "nearby-places", "general"],
      default: "general",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
