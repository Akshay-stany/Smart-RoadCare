import { useState, useEffect, useCallback } from "react";

export const DEFAULT_CIVIC_CENTER = [12.9716, 77.5946]; // Bengaluru Civic Center
export const DEFAULT_CIVIC_ADDRESS = "100 Feet Rd, Indiranagar, Bengaluru, Karnataka";

/**
 * Reverse geocode a latitude/longitude pair into a human-readable street address.
 */
export async function reverseGeocode(lat, lng) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
      {
        signal: controller.signal,
        headers: { "Accept-Language": "en" },
      }
    );
    clearTimeout(timer);
    if (!res.ok) throw new Error("Geocode failed");
    const data = await res.json();
    const addr = data?.address;
    const parts = [
      addr?.road || addr?.pedestrian || addr?.highway,
      addr?.suburb || addr?.neighbourhood || addr?.residential,
      addr?.city || addr?.town || addr?.village || addr?.county,
      addr?.state,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(", ");
    }
    return data?.display_name?.split(",").slice(0, 3).join(",") || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)} (Bengaluru Area)`;
  }
}

/**
 * Forward geocode a place name or address string to coordinates.
 */
export async function searchLocation(query) {
  if (!query || query.trim().length < 2) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + " Bengaluru"
      )}&limit=1&accept-language=en`,
      {
        signal: controller.signal,
        headers: { "Accept-Language": "en" },
      }
    );
    clearTimeout(timer);
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
  } catch {
    // Ignore search failure
  }
  return null;
}

/**
 * Resilient GPS position fetcher that tries high-accuracy GNSS,
 * falls back to low-accuracy Wi-Fi/cell triangulation, and defaults safely.
 */
export async function fetchCurrentPosition() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      resolve({
        coords: { latitude: DEFAULT_CIVIC_CENTER[0], longitude: DEFAULT_CIVIC_CENTER[1], accuracy: 50 },
        source: "default",
      });
      return;
    }

    // 1. First attempt: High accuracy GPS
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 15,
          },
          source: "gps_high_accuracy",
        });
      },
      () => {
        // 2. Second attempt: Low accuracy (Wi-Fi/cellular triangulation for desktop/laptops)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy || 80,
              },
              source: "gps_network",
            });
          },
          () => {
            // 3. Fallback: IP-based location or civic default
            fetch("https://ipapi.co/json/")
              .then((res) => res.json())
              .then((data) => {
                if (data.latitude && data.longitude) {
                  resolve({
                    coords: {
                      latitude: data.latitude,
                      longitude: data.longitude,
                      accuracy: 1000,
                    },
                    source: "ip_geolocate",
                  });
                } else {
                  throw new Error("No IP coords");
                }
              })
              .catch(() => {
                resolve({
                  coords: {
                    latitude: DEFAULT_CIVIC_CENTER[0],
                    longitude: DEFAULT_CIVIC_CENTER[1],
                    accuracy: 100,
                  },
                  source: "civic_default",
                });
              });
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  });
}

export function useGeolocation() {
  const [position, setPosition] = useState(DEFAULT_CIVIC_CENTER);
  const [address, setAddress] = useState(DEFAULT_CIVIC_ADDRESS);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("initialized");

  const locate = useCallback(async () => {
    setLoading(true);
    try {
      const pos = await fetchCurrentPosition();
      const coords = [pos.coords.latitude, pos.coords.longitude];
      setPosition(coords);
      setSource(pos.source);
      const addr = await reverseGeocode(coords[0], coords[1]);
      setAddress(addr);
      return { coords, address: addr, source: pos.source };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    position,
    setPosition,
    address,
    setAddress,
    loading,
    source,
    locate,
  };
}
