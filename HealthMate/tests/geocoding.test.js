import { describe, it, expect, vi, beforeEach } from "vitest";

// Define mock get function
const mockGet = vi.fn();

// Overwrite Node require cache for axios with our mock
const axiosPath = require.resolve("axios");
const axiosMock = {
  get: mockGet,
};

// Inject mock into Node module cache
require.cache[axiosPath] = {
  id: axiosPath,
  filename: axiosPath,
  loaded: true,
  exports: axiosMock,
};

// Require our helper - it will receive the mock axios
const { geocodeLocation } = require("../utils/geocoding");

describe("Geocoding Service Helper", () => {
  beforeEach(() => {
    mockGet.mockClear();
  });

  it("should successfully resolve coordinates using Photon", async () => {
    const mockPhotonResponse = {
      data: {
        features: [
          {
            geometry: { coordinates: [72.8777, 19.0760] },
            properties: { name: "Mumbai", city: "Mumbai", country: "India" }
          }
        ]
      }
    };
    mockGet.mockResolvedValueOnce(mockPhotonResponse);

    const coords = await geocodeLocation("Mumbai");
    expect(coords).not.toBeNull();
    expect(coords.lat).toBe(19.0760);
    expect(coords.lon).toBe(72.8777);
    expect(coords.name).toBe("Mumbai, Mumbai, India");
  });

  it("should fall back to Nominatim when Photon fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("Photon Offline"));

    const mockNominatimResponse = {
      data: [
        { lat: "19.0760", lon: "72.8777", display_name: "Mumbai, Maharashtra, India" }
      ]
    };
    mockGet.mockResolvedValueOnce(mockNominatimResponse);

    const coords = await geocodeLocation("Mumbai");
    expect(coords).not.toBeNull();
    expect(coords.lat).toBe(19.0760);
    expect(coords.lon).toBe(72.8777);
    expect(coords.name).toBe("Mumbai, Maharashtra, India");
  });
});
