const axios = require("axios");
const { geocodeLocation } = require("../utils/geocoding");

function getAqiLabel(aqi) {
  if (aqi <= 1) return "Good";
  if (aqi <= 2) return "Fair";
  if (aqi <= 3) return "Moderate";
  if (aqi <= 4) return "Poor";
  return "Very Poor";
}

exports.environmentController = async (req, res) => {
  const { location } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (typeof location !== "string" || !location.trim()) {
    return res.status(400).json({ error: "Please provide a valid location string." });
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
