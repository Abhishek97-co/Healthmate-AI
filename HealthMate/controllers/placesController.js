const axios = require("axios");
const PlaceReview = require("../models/placeReviewModel");
const { geocodeLocation } = require("../utils/geocoding");

async function searchGooglePlaces(query, type) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const { data } = await axios.get(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
      {
        params: {
          query: `${type} near ${query}`,
          key: apiKey,
        },
      }
    );

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.warn("Google Places API error status:", data.status, data.error_message);
      return null;
    }

    return (data.results || []).slice(0, 10).map((place) => ({
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || null,
      totalRatings: place.user_ratings_total || 0,
      openNow: place.opening_hours?.open_now ?? null,
      source: "google",
      lat: place.geometry?.location?.lat,
      lon: place.geometry?.location?.lng,
    }));
  } catch (err) {
    console.error("Google Places API query failed, falling back to OSM:", err.message);
    return null;
  }
}

async function searchOSMPlaces(location, amenity) {
  const cityName = location.split(",")[0].trim();

  const { data } = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: {
      q: `${amenity} near ${cityName}`,
      format: "json",
      limit: 15,
      addressdetails: 1,
    },
    headers: {
      "User-Agent": "HealthMate/1.0 (healthmate-app)",
      Accept: "application/json",
    },
    timeout: 15000,
  });

  return (data || []).map((place) => ({
    name: place.name || place.display_name?.split(",")[0] || "Unnamed",
    address: place.display_name || "Address not available",
    rating: null,
    totalRatings: 0,
    openNow: null,
    source: "openstreetmap",
    lat: place.lat,
    lon: place.lon,
  }));
}

exports.nearbyPlacesController = async (req, res) => {
  const { location, type = "pharmacy" } = req.body;

  if (typeof location !== "string" || !location.trim()) {
    return res.status(400).json({ error: "Please provide a valid location string." });
  }

  const typeMap = {
    pharmacy: { google: "medical store pharmacy", osm: "pharmacy" },
    clinic: { google: "clinic doctor", osm: "clinic" },
    hospital: { google: "hospital", osm: "hospital" },
  };

  const searchType = typeMap[type] || typeMap.pharmacy;

  try {
    const googleResults = await searchGooglePlaces(location, searchType.google);
    if (googleResults?.length) {
      return res.status(200).json({ places: googleResults, source: "google" });
    }

    const coords = await geocodeLocation(location);
    const osmResults = await searchOSMPlaces(location, searchType.osm);

    if (!osmResults.length && !coords) {
      return res.status(404).json({ error: "Location not found. Try a more specific city or area name." });
    }

    return res.status(200).json({
      places: osmResults,
      source: "openstreetmap",
      location: coords?.displayName || location,
      note: "Add GOOGLE_PLACES_API_KEY in .env for Google ratings.",
    });
  } catch (error) {
    console.error("Places error:", error.response?.status, error.message);
    return res.status(500).json({ error: error.message || "Failed to fetch nearby places." });
  }
};

// GET REVIEWS FOR A SPECIFIC PLACE
exports.getPlaceReviewsController = async (req, res) => {
  const { name, address } = req.query;

  if (typeof name !== "string" || typeof address !== "string" || !name.trim() || !address.trim()) {
    return res.status(400).json({ error: "Place name and address must be non-empty strings." });
  }

  try {
    const reviews = await PlaceReview.find({
      placeName: name.trim(),
      placeAddress: address.trim(),
    }).sort({ createdAt: -1 });

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
      averageRating = parseFloat((sum / reviews.length).toFixed(1));
    }

    return res.status(200).json({ reviews, averageRating });
  } catch (error) {
    console.error("Error fetching place reviews:", error);
    return res.status(500).json({ error: "Failed to fetch reviews for this place." });
  }
};

// CREATE A REVIEW FOR A SPECIFIC PLACE (Protected)
exports.createPlaceReviewController = async (req, res) => {
  const { name, address, rating, comment } = req.body;

  if (
    typeof name !== "string" ||
    typeof address !== "string" ||
    typeof comment !== "string" ||
    !name.trim() ||
    !address.trim() ||
    !comment.trim()
  ) {
    return res.status(400).json({ error: "Place name, address, and comment must be non-empty strings." });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5." });
  }

  try {
    const review = new PlaceReview({
      placeName: name.trim(),
      placeAddress: address.trim(),
      rating,
      comment: comment.trim(),
      username: req.user.username,
      user: req.user.id,
    });

    await review.save();
    return res.status(201).json({ success: true, review });
  } catch (error) {
    console.error("Error creating place review:", error);
    return res.status(500).json({ error: "Failed to save your review." });
  }
};
