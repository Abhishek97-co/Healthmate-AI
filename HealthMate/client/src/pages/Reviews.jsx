import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Rating, Button } from "@mui/material";
import { Star as StarIcon } from "@mui/icons-material";

const CATEGORIES = ["general", "chatbot", "diet-plan", "nearby-places"];

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const loggedIn = !!localStorage.getItem("authToken");

  const [form, setForm] = useState({
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
      toast.success("Review submitted successfully!");
      setForm({ rating: 5, title: "", experience: "", category: "general" });
      fetchReviews();
    } catch (err) {
      console.error("Failed to submit review in console:", err.response?.data?.error || err.message);
      toast.error(err.response?.data?.error || "Error submitting review");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-transparent text-white px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#fd5b5b]">User community</p>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Hear from our community
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Read experience logs and share your own feedback to help us build a healthier future together.
          </p>
        </div>

        {/* Top Layout Grid: Form (Left) & Summary (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Write a Review Section */}
          <div className="lg:col-span-5">
            {loggedIn ? (
              <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
                <div className="border-b border-white/10 pb-3">
                  <h2 className="font-bold text-lg text-white">Submit your experience</h2>
                  <p className="text-xs text-slate-400 mt-1">Fill out the log to publish your feedback.</p>
                </div>

                {/* Custom Category Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full text-left bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-white flex items-center justify-between hover:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-[#fd5b5b]/50 transition duration-200"
                  >
                    <span>{form.category.toUpperCase().replace("-", " ")}</span>
                    <span className={`transform transition-transform duration-200 text-slate-400 text-xs ${dropdownOpen ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </button>
                  
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-2xl overflow-hidden py-1">
                        {CATEGORIES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, category: c });
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition hover:bg-[#fd5b5b]/20 hover:text-white ${
                              form.category === c ? "bg-[#fd5b5b]/10 text-[#fd5b5b]" : "text-slate-300"
                            }`}
                          >
                            {c.toUpperCase().replace("-", " ")}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Rating Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Rating
                  </label>
                  <div className="flex items-center gap-2">
                    <Rating
                      value={form.rating}
                      onChange={(_, v) => setForm({ ...form, rating: v })}
                      icon={<StarIcon sx={{ color: "#fd5b5b" }} />}
                      emptyIcon={<StarIcon sx={{ color: "rgba(255,255,255,0.15)" }} />}
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Review Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Incredible AI Nutrition scanner!"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#fd5b5b]/50 transition duration-200"
                  />
                </div>

                {/* Experience */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Your Experience
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe how HealthMate helped you..."
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#fd5b5b]/50 transition duration-200 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  fullWidth
                  className="!rounded-full !bg-[#fd5b5b] !py-3 !text-sm !font-bold !text-white hover:!bg-[#e04a4a] !normal-case"
                >
                  Submit Review
                </Button>
              </form>
            ) : (
              <div className="glass-card p-6 text-center space-y-4">
                <div className="text-4xl">🔒</div>
                <h3 className="font-bold text-white">Feedback Log Locked</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Please sign in to log your experience and contribute to the community rating index.
                </p>
                <Link to="/login" className="block">
                  <Button
                    fullWidth
                    className="!rounded-full !bg-[#fd5b5b] !py-2.5 !text-sm !font-bold !text-white hover:!bg-[#e04a4a] !normal-case"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Review Stream (Right) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-bold text-lg text-white">Community Reviews Stream ({reviews.length})</h2>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Recent Logs</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 glass-card">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fd5b5b] border-t-transparent" />
                <p className="text-xs text-slate-400">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="glass-card py-16 text-center space-y-3">
                <p className="text-slate-500 text-sm">No community logs registered yet.</p>
                <p className="text-xs text-slate-600">Be the first to leave your footprints!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {reviews.map((review) => (
                  <div key={review._id} className="glass-card p-4 md:p-5 flex flex-col justify-between gap-4 hover:border-white/20 transition-all duration-300 relative group overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-[#fd5b5b]/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-300" />
                    
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#fd5b5b]/10 text-[#fd5b5b] font-bold uppercase tracking-wider">
                          {review.category.replace("-", " ")}
                        </span>
                        <Rating
                          value={review.rating}
                          readOnly
                          size="small"
                          icon={<StarIcon sx={{ color: "#fd5b5b" }} />}
                          emptyIcon={<StarIcon sx={{ color: "rgba(255,255,255,0.1)" }} />}
                        />
                      </div>
                      <h3 className="font-bold text-white text-sm mt-3">{review.title}</h3>
                      <p className="text-slate-300 text-xs mt-2 leading-relaxed italic">
                        "{review.experience}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] text-slate-400 truncate font-semibold">
                          @{review.username}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 shrink-0">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reviews;
