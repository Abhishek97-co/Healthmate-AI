const axios = require("axios");

/**
 * Resolves coordinates (latitude, longitude) and a formatted display name
 * for a query string location using Photon API, falling back to Nominatim OSM.
 * 
 * @param {string} query - The location query string (e.g. "Mumbai, India")
 * @returns {Promise<{lat: number, lon: number, name: string}|null>}
 */
async function geocodeLocation(query) {
  try {
    const { data } = await axios.get("https://photon.komoot.io/api/", {
      params: { q: query, limit: 1 },
      timeout: 10000,
    });
    if (data?.features?.length) {
      const [lon, lat] = data.features[0].geometry.coordinates;
      const props = data.features[0].properties;
      const name = [props.name, props.city, props.country].filter(Boolean).join(", ");
      return { lat, lon, name, displayName: name };
    }
  } catch (err) {
    console.error("Photon geocode failed:", err.message);
  }

  try {
    const { data } = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: query, format: "json", limit: 1 },
      headers: { 
        "User-Agent": "HealthMate/1.0 (contact@healthmate.local)", 
        Accept: "application/json" 
      },
      timeout: 10000,
    });
    if (!data?.length) return null;
    return { 
      lat: parseFloat(data[0].lat), 
      lon: parseFloat(data[0].lon), 
      name: data[0].display_name,
      displayName: data[0].display_name
    };
  } catch (err) {
    console.error("Nominatim geocode failed:", err.message);
    return null;
  }
}

module.exports = { geocodeLocation };
