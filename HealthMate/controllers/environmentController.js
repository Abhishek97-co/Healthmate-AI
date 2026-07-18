const axios = require("axios");

function getAqiLabel(aqi) {
  if (aqi <= 1) return "Good";
  if (aqi <= 2) return "Fair";
  if (aqi <= 3) return "Moderate";
  if (aqi <= 4) return "Poor";
  return "Very Poor";
}

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
      return { lat, lon, name };
    }
  } catch {
    // fallback below
  }

  const { data } = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: { q: query, format: "json", limit: 1 },
    headers: { "User-Agent": "HealthMate/1.0", Accept: "application/json" },
  });
  if (!data?.length) return null;
  return { lat: data[0].lat, lon: data[0].lon, name: data[0].display_name };
}

exports.environmentController = async (req, res) => {
  const { location } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!location?.trim()) {
    return res.status(400).json({ error: "Please provide a location." });
  }

  if (!apiKey) {
    return res.status(200).json({
      available: false,
      message: "Add OPENWEATHER_API_KEY in .env for environment-aware health tips.",
    });
  }

  try {
    const geo = await geocodeLocation(location);
    if (!geo) {
      return res.status(404).json({ error: "Location not found." });
    }

    const [weatherRes, airRes] = await Promise.all([
      axios.get("https://api.openweathermap.org/data/2.5/weather", {
        params: { lat: geo.lat, lon: geo.lon, appid: apiKey, units: "metric" },
      }),
      axios.get("https://api.openweathermap.org/data/2.5/air_pollution", {
        params: { lat: geo.lat, lon: geo.lon, appid: apiKey },
      }),
    ]);

    const weather = weatherRes.data;
    const aqi = airRes.data?.list?.[0]?.main?.aqi || 1;

    return res.status(200).json({
      available: true,
      location: geo.name,
      temperature: Math.round(weather.main.temp),
      humidity: weather.main.humidity,
      description: weather.weather[0]?.description || "unknown",
      aqi,
      aqiLabel: getAqiLabel(aqi),
    });
  } catch (error) {
    console.error("Environment error:", error.message);
    return res.status(500).json({ error: "Failed to fetch environment data." });
  }
};
