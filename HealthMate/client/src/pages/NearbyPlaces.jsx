import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { TextField, Button, Tabs, Tab, Rating, Collapse, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import {
  Star as StarIcon,
  LocationOn as LocationOnIcon,
  Forum as ForumIcon,
  RateReview as RateReviewIcon,
  Directions as DirectionsIcon
} from "@mui/icons-material";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { useAuthStore } from "../store/useAuthStore";

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
];

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

  // Map States
  const [directions, setDirections] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Booking States
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingPlace, setBookingPlace] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("10:00 AM");
  const [bookingReason, setBookingReason] = useState("");

  const loggedIn = !!localStorage.getItem("authToken");
  const user = useAuthStore((state) => state.user);

  const handleOpenBookingModal = (place) => {
    if (!loggedIn) {
      toast.error("Please sign in to book an appointment");
      return;
    }
    setBookingPlace(place);
    setBookingDate(new Date().toISOString().split("T")[0]);
    setBookingTime("10:00 AM");
    setBookingReason("");
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!bookingDate || !bookingTime || !bookingReason.trim()) {
      toast.error("Please fill in all booking fields.");
      return;
    }

    const newBooking = {
      id: Date.now(),
      clinicName: bookingPlace.name,
      clinicAddress: bookingPlace.address,
      date: bookingDate,
      time: bookingTime,
      reason: bookingReason.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      const storageKey = user?.id ? `clinicBookings_${user.id}` : "clinicBookings";
      const activeBookings = JSON.parse(localStorage.getItem(storageKey) || "[]");
      localStorage.setItem(storageKey, JSON.stringify([newBooking, ...activeBookings]));
      toast.success(`Consultation successfully booked with ${bookingPlace.name}!`);
      setBookingModalOpen(false);
    } catch (err) {
      console.error("Booking failed:", err);
      toast.error("Failed to save booking. Please try again.");
    }
  };
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!location.trim()) return;

    setLoading(true);
    setPlaces([]);
    setExpandedReviewsIdx(null);
    setPlaceReviewsData({});
    setDirections(null);
    setSelectedPlace(null);

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

  const handleShowDirections = async (place) => {
    setSelectedPlace(place);
    setDirections(null);

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const destination = {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon),
        };

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              setDirections(result);
            } else if (status === "REQUEST_DENIED") {
              toast.error("Directions Denied: Please enable Billing on your Google Cloud Console project.");
            } else {
              toast.error(`Could not calculate directions: ${status}`);
            }
          }
        );
      },
      (err) => {
        toast.error("Failed to get your current location. Please grant permission.");
      }
    );
  };

  const buildMapsUrl = (place) => {
    const query = encodeURIComponent(`${place.name} ${place.address || ""}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const renderMap = () => {
    if (!apiKey) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-slate-955/40 backdrop-blur-xl">
          <LocationOnIcon sx={{ fontSize: 48, color: "#fd5b5b", mb: 2 }} />
          <h3 className="font-bold text-white mb-2">Interactive Map Locked</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
            Configure your VITE_GOOGLE_MAPS_API_KEY inside the client folder .env file to enable the interactive map tracker and route planning.
          </p>
          {places.length > 0 && (
            <p className="text-xs text-amber-400/80 font-medium">
              ({places.length} resources found, listed on the left panel)
            </p>
          )}
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-slate-955/40">
          <LocationOnIcon sx={{ fontSize: 48, color: "#fd5b5b", mb: 2 }} />
          <h3 className="font-bold text-white mb-2">Map Load Error</h3>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Failed to load Google Maps SDK. Please check your API key configuration and network connectivity.
          </p>
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400 bg-slate-955/40 backdrop-blur-xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fd5b5b] border-t-transparent" />
        </div>
      );
    }

    const defaultCenter = places.length > 0 && places[0].lat && places[0].lon
      ? { lat: parseFloat(places[0].lat), lng: parseFloat(places[0].lon) }
      : { lat: 19.0760, lng: 72.8777 };

    return (
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={selectedPlace ? { lat: parseFloat(selectedPlace.lat), lng: parseFloat(selectedPlace.lon) } : defaultCenter}
        zoom={selectedPlace ? 15 : 12}
        options={{
          styles: darkMapStyles,
          disableDefaultUI: false,
        }}
      >
        {places.map((place, idx) => {
          if (!place.lat || !place.lon) return null;
          return (
            <Marker
              key={idx}
              position={{ lat: parseFloat(place.lat), lng: parseFloat(place.lon) }}
              title={place.name}
              onClick={() => setSelectedPlace(place)}
            />
          );
        })}
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
    );
  };

  return (
    <div className="min-h-screen text-white pb-10">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#fd5b5b]">Nearby medical support</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Find trusted hospitals, clinics, and pharmacies near you</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Search by locality, compare helpful details, and view them directly on the map or plan driving routes.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mt-6 items-start">
          {/* Left panel: Search and list */}
          <div className="w-full lg:w-[45%] flex flex-col space-y-4">
            <form onSubmit={handleSearch} className="glass-card p-4 md:p-6 w-full">
              <TextField
                fullWidth
                label="Your Location"
                placeholder="e.g. Delhi, India or your area name"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
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
                          <DirectionsIcon sx={{ fontSize: 16 }} /> Open Maps
                        </a>
                        <button
                          onClick={() => handleOpenBookingModal(place)}
                          className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-400 transition hover:bg-green-500/20 cursor-pointer"
                        >
                          📅 Book Visit
                        </button>
                        <button
                          onClick={() => handleToggleReviews(idx, place)}
                          className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                        >
                          <ForumIcon sx={{ fontSize: 14 }} />
                          {expandedReviewsIdx === idx ? "Hide Ratings" : `Reviews (${communityData.reviews.length})`}
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

          {/* Right panel: Sticky map */}
          <div className="w-full lg:w-[55%] h-[400px] lg:h-[calc(100vh-14rem)] lg:sticky lg:top-24 rounded-[28px] border border-white/10 bg-[#0f172a] overflow-hidden min-h-[350px]">
            {renderMap()}
          </div>
        </div>
      </div>
      <Dialog
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "#0f172a",
            color: "white",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "24px",
            maxWidth: "420px",
            width: "100%",
            p: 2,
            backdropFilter: "blur(20px)"
          }
        }}
      >
        <DialogTitle className="!text-center !text-[#fd5b5b] !font-bold !text-xl">
          Schedule Consultation
        </DialogTitle>
        <DialogContent className="space-y-4 !pt-2">
          {bookingPlace && (
            <div className="rounded-xl bg-white/5 p-3 border border-white/5 mb-2">
              <p className="text-xs text-slate-400">Selected Facility</p>
              <p className="font-semibold text-white mt-0.5">{bookingPlace.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{bookingPlace.address}</p>
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Appointment Date</label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-xl bg-slate-900 border border-white/10 p-2.5 text-sm text-white focus:outline-none focus:border-[#fd5b5b]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Preferred Time Slot</label>
            <select
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-white/10 p-2.5 text-sm text-white focus:outline-none focus:border-[#fd5b5b]"
            >
              <option value="09:00 AM">09:00 AM (Morning)</option>
              <option value="10:30 AM">10:30 AM (Morning)</option>
              <option value="11:30 AM">11:30 AM (Morning)</option>
              <option value="02:00 PM">02:00 PM (Afternoon)</option>
              <option value="03:30 PM">03:30 PM (Afternoon)</option>
              <option value="05:00 PM">05:00 PM (Evening)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Reason for Visit</label>
            <textarea
              rows={3}
              placeholder="e.g. Regular health checkup, cardiology review, vaccination..."
              value={bookingReason}
              onChange={(e) => setBookingReason(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-white/10 p-2.5 text-sm text-white focus:outline-none focus:border-[#fd5b5b] resize-none"
            />
          </div>
        </DialogContent>
        <DialogActions className="!justify-center !pb-3 !gap-2">
          <Button
            onClick={handleConfirmBooking}
            className="!bg-[#fd5b5b] hover:!bg-[#e04a4a] !text-white !font-bold !px-6 !py-2.5 !rounded-xl !normal-case"
          >
            Confirm Booking
          </Button>
          <Button
            onClick={() => setBookingModalOpen(false)}
            className="!border !border-white/10 hover:!bg-white/5 !text-slate-300 !font-semibold !px-6 !py-2.5 !rounded-xl !normal-case"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default NearbyPlaces;
