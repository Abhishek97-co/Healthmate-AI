import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { TextField, Button, Tabs, Tab, Rating, Collapse, Divider } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ForumIcon from "@mui/icons-material/Forum";
import RateReviewIcon from "@mui/icons-material/RateReview";
import DirectionsIcon from "@mui/icons-material/Directions";

const PLACE_TYPES = [
  { value: "pharmacy", label: "Medical Stores" },
  { value: "clinic", label: "Clinics" },
  { value: "hospital", label: "Hospitals" },
];

const NearbyPlaces = () => {
  const [location, setLocation] = useState("");
  const [type, setType] = useState("pharmacy");
  const [places, setPlaces] = useState([]);
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedReviewsIdx, setExpandedReviewsIdx] = useState(null);
  const [placeReviewsData, setPlaceReviewsData] = useState({});
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  const loggedIn = !!localStorage.getItem("authToken");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!location.trim()) return;

    setLoading(true);
    setPlaces([]);
    setExpandedReviewsIdx(null);
    setPlaceReviewsData({});

    try {
      const { data } = await axios.post("/api/v1/places/nearby", { location, type });
      setPlaces(data.places || []);
      setSource(data.source || "");
      setNote(data.note || "");
    } catch (err) {
      console.error("Nearby search failed in console:", err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewsForPlace = async (placeName, placeAddress, index) => {
    setLoadingReviews(true);
    try {
      const { data } = await axios.get("/api/v1/places/reviews", {
        params: { name: placeName, address: placeAddress },
      });
      setPlaceReviewsData((prev) => ({
        ...prev,
        [index]: {
          reviews: data.reviews || [],
          averageRating: data.averageRating || 0,
        },
      }));
    } catch (err) {
      console.error("Failed to load place reviews in console:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleToggleReviews = (index, place) => {
    if (expandedReviewsIdx === index) {
      setExpandedReviewsIdx(null);
      return;
    }
    setExpandedReviewsIdx(index);
    setNewComment("");
    setNewRating(5);
    fetchReviewsForPlace(place.name, place.address, index);
  };

  const handleSubmitReview = async (e, place, index) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    try {
      await axios.post("/api/v1/places/reviews", {
        name: place.name,
        address: place.address,
        rating: newRating,
        comment: newComment.trim(),
      });
      toast.success("Thank you for your rating!");
      setNewComment("");
      setNewRating(5);
      fetchReviewsForPlace(place.name, place.address, index);
    } catch (err) {
      console.error("Failed to save review in console:", err.response?.data?.error || err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const buildMapsUrl = (place) => {
    const query = encodeURIComponent(`${place.name} ${place.address || ""}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#fd5b5b]">Nearby medical support</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Find trusted hospitals, clinics, and pharmacies near you</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Search by locality, compare helpful details, and open any result directly in Google Maps for fast navigation.
          </p>
        </div>

        <form onSubmit={handleSearch} className="glass-card mb-8 p-4 md:p-6">
          <TextField
            fullWidth
            label="Your Location"
            placeholder="e.g. Delhi, India or your area name"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            sx={{ "& .MuiInputBase-root": { bgcolor: "#f4e9e7", borderRadius: "14px", color: "black" } }}
          />

          <Tabs
            value={type}
            onChange={(_, v) => setType(v)}
            variant="fullWidth"
            sx={{ mt: 3, "& .MuiTab-root": { color: "gray", "&.Mui-selected": { color: "#fd5b5b" } }, "& .MuiTabs-indicator": { bgcolor: "#fd5b5b" } }}
          >
            {PLACE_TYPES.map((t) => (
              <Tab key={t.value} value={t.value} label={t.label} />
            ))}
          </Tabs>

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            className="!mt-4 !rounded-full !bg-[#fd5b5b] !py-3 !font-bold !text-white hover:!bg-[#e04a4a] !normal-case"
          >
            {loading ? "Searching Nearby..." : "Search Resources"}
          </Button>
        </form>

        {note && <p className="mb-4 text-center text-xs text-yellow-400/80">{note}</p>}

        {source && (
          <p className="mb-4 text-center text-xs text-slate-500">
            Data source: {source === "google" ? "Google Places" : "OpenStreetMap"}
          </p>
        )}

        <div className="space-y-4">
          {places.map((place, idx) => {
            const communityData = placeReviewsData[idx] || { reviews: [], averageRating: 0 };
            const hasReviews = communityData.reviews.length > 0;

            return (
              <div key={idx} className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition-all hover:border-[#fd5b5b]/30 md:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-white">{place.name}</h3>
                    <p className="mt-1 flex items-start gap-1 text-sm text-slate-400">
                      <LocationOnIcon fontSize="small" className="mt-0.5 shrink-0 text-slate-500" />
                      <span className="break-words">{place.address}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-1 sm:items-end">
                    {place.rating && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <StarIcon sx={{ fontSize: 16 }} />
                        <span className="text-sm font-semibold">{place.rating}</span>
                        <span className="text-xs text-slate-500">(Google)</span>
                      </div>
                    )}
                    {hasReviews && (
                      <div className="flex items-center gap-1 text-[#fd5b5b]">
                        <StarIcon sx={{ fontSize: 16 }} />
                        <span className="text-sm font-semibold">{communityData.averageRating}</span>
                        <span className="text-xs text-slate-500">({communityData.reviews.length} user reviews)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {place.openNow !== null ? (
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${place.openNow ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {place.openNow ? "Open Now" : "Closed"}
                    </span>
                  ) : <div />}

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={buildMapsUrl(place)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-[#fd5b5b]/30 bg-[#fd5b5b]/10 px-3 py-2 text-xs font-semibold text-[#fd5b5b] transition hover:bg-[#fd5b5b]/20"
                    >
                      <DirectionsIcon sx={{ fontSize: 16 }} /> Open in Google Maps
                    </a>
                    <button
                      onClick={() => handleToggleReviews(idx, place)}
                      className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                    >
                      <ForumIcon sx={{ fontSize: 14 }} />
                      {expandedReviewsIdx === idx ? "Hide Ratings" : `Ratings & Reviews (${communityData.reviews.length})`}
                    </button>
                  </div>
                </div>

                <Collapse in={expandedReviewsIdx === idx}>
                  <Divider className="!my-4" sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-1 text-sm font-bold text-[#fd5b5b]">
                      <RateReviewIcon sx={{ fontSize: 16 }} /> HealthMate Community Reviews
                    </h4>

                    {loadingReviews ? (
                      <p className="text-xs text-slate-500">Loading reviews...</p>
                    ) : communityData.reviews.length === 0 ? (
                      <p className="text-xs text-slate-500">No community reviews left on our website yet. Be the first to share your experience!</p>
                    ) : (
                      <div className="space-y-3">
                        {communityData.reviews.map((rev) => (
                          <div key={rev._id} className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#fd5b5b]">{rev.username}</span>
                              <Rating value={rev.rating} readOnly size="small" icon={<StarIcon sx={{ color: "#fd5b5b", fontSize: 12 }} />} />
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-slate-300">{rev.comment}</p>
                            <span className="mt-2 block text-[10px] text-slate-600">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2">
                      {loggedIn ? (
                        <form onSubmit={(e) => handleSubmitReview(e, place, idx)} className="space-y-3 rounded-2xl border border-white/5 bg-slate-950/20 p-3">
                          <p className="text-xs font-semibold text-slate-300">Rate this resource</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Rating:</span>
                            <Rating
                              value={newRating}
                              onChange={(_, v) => setNewRating(v || 5)}
                              icon={<StarIcon sx={{ color: "#fd5b5b" }} />}
                            />
                          </div>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Share your experience (e.g. queue time, store availability, clinic hygiene)..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            required
                            multiline
                            rows={2}
                            sx={{ "& .MuiInputBase-root": { bgcolor: "#f4e9e7", borderRadius: "10px", fontSize: "12px", color: "black" } }}
                          />
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              size="small"
                              disabled={submittingReview || !newComment.trim()}
                              className="!rounded-full !bg-[#fd5b5b] !px-4 !py-1.5 !text-xs !font-bold !text-white hover:!bg-[#e04a4a] !normal-case"
                            >
                              {submittingReview ? "Submitting..." : "Submit Rating"}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <p className="rounded-xl bg-slate-950/20 py-2 text-center text-xs text-slate-500">
                          Please <Link to="/login" className="font-semibold text-[#fd5b5b] hover:underline">Sign In</Link> to rate and review this medical resource.
                        </p>
                      )}
                    </div>
                  </div>
                </Collapse>
              </div>
            );
          })}

          {!loading && places.length === 0 && location && (
            <p className="text-center text-slate-500">No medical resources found. Try another city or locality query.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NearbyPlaces;
