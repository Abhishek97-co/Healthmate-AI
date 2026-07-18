import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { TextField, Button, Rating } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

const CATEGORIES = ["general", "chatbot", "diet-plan", "nearby-places"];

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: "",
    rating: 5,
    title: "",
    experience: "",
    category: "general",
  });

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get("/api/v1/reviews");
      setReviews(data.reviews || []);
    } catch (err) {
      console.error("Failed to load reviews in console:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/v1/reviews", form);
      toast.success("Review submitted!");
      setForm({ username: "", rating: 5, title: "", experience: "", category: "general" });
      fetchReviews();
    } catch (err) {
      console.error("Failed to submit review in console:", err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-2xl md:text-4xl font-bold text-center text-[#fd5b5b] mb-2">
          Community Reviews
        </h1>
        <p className="text-gray-400 text-center text-sm md:text-base mb-8">
          Share your HealthMate experience to help others make informed decisions.
        </p>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-gray-800/50 p-4 md:p-6 mb-10">
          <h2 className="font-semibold text-lg mb-4">Write a Review</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Your Name"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              sx={{ "& .MuiInputBase-root": { bgcolor: "#ead5d3", borderRadius: "8px" } }}
            />
            <TextField
              select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              SelectProps={{ native: true }}
              sx={{ "& .MuiInputBase-root": { bgcolor: "#ead5d3", borderRadius: "8px" } }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </TextField>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-400">Rating:</span>
            <Rating
              value={form.rating}
              onChange={(_, v) => setForm({ ...form, rating: v })}
              icon={<StarIcon sx={{ color: "#fd5b5b" }} />}
            />
          </div>

          <TextField
            fullWidth
            className="!mt-4"
            label="Review Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            sx={{ "& .MuiInputBase-root": { bgcolor: "#ead5d3", borderRadius: "8px" } }}
          />
          <TextField
            fullWidth
            className="!mt-4"
            label="Your Experience"
            required
            multiline
            rows={4}
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
            sx={{ "& .MuiInputBase-root": { bgcolor: "#ead5d3", borderRadius: "8px" } }}
          />

          <Button type="submit" className="!mt-4 !px-6 !py-2 !text-white !rounded-xl !bg-[#fd5b5b] hover:!bg-[#e04a4a]">
            Submit Review
          </Button>
        </form>

        <h2 className="font-semibold text-lg mb-4">What Users Say</h2>
        {loading ? (
          <p className="text-gray-500 text-center">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-500 text-center">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold">{review.title}</h3>
                    <p className="text-sm text-gray-400">by {review.username} · {review.category}</p>
                  </div>
                  <Rating value={review.rating} readOnly size="small" icon={<StarIcon sx={{ color: "#fd5b5b" }} />} />
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{review.experience}</p>
                <p className="text-xs text-gray-600 mt-2">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
