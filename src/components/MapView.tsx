import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { Complaint } from "@/hooks/useComplaints";
import { Locate, Layers } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "#dc2626",
  in_progress: "#eab308",
  resolved: "#16a34a",
};

const statusShortLabels: Record<string, string> = {
  pending: "P",
  in_progress: "IP",
  resolved: "R",
};

const MAP_STYLE_ID = "roadcare-map-styles";

type ComplaintStatus = Complaint["status"];

type ComplaintMarker = L.Marker & {
  complaintStatus?: ComplaintStatus;
};

type ComplaintLayerEntry = {
  marker: ComplaintMarker;
  circle: L.Circle;
  signature: string;
};

function ensureMapStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(MAP_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = MAP_STYLE_ID;
  style.textContent = `
    @keyframes roadcare-marker-pulse {
      0% { transform: scale(0.98); opacity: 0.75; }
      70% { transform: scale(1.25); opacity: 0; }
      100% { transform: scale(1.25); opacity: 0; }
    }

    .roadcare-marker { position: relative; width: 34px; height: 34px; display: grid; place-items: center; }
    .roadcare-marker__pulse {
      position: absolute;
      inset: 3px;
      border-radius: 9999px;
      animation: roadcare-marker-pulse 1.6s ease-out infinite;
    }
    .roadcare-marker__core {
      position: relative;
      width: 26px;
      height: 26px;
      border-radius: 9999px;
      border: 2px solid #fff;
      color: #fff;
      display: grid;
      place-items: center;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.01em;
      box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2), 0 5px 12px rgba(0, 0, 0, 0.3);
    }

    .roadcare-cluster {
      width: 42px;
      height: 42px;
      border-radius: 9999px;
      border: 2px solid #fff;
      color: #fff;
      display: grid;
      place-items: center;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
    }
  `;

  document.head.appendChild(style);
}

const createMarkerIcon = (status: string) => {
  const color = statusColors[status] || "#6b7280";
  const shortLabel = statusShortLabels[status] || "•";

  return L.divIcon({
    className: "roadcare-marker-icon",
    html: `<div class="roadcare-marker">
      <span class="roadcare-marker__pulse" style="background:${color}66"></span>
      <span class="roadcare-marker__core" style="background:${color}">${shortLabel}</span>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -14],
  });
};

function getCircleRadiusForZoom(zoomLevel: number): number {
  const calculated = 1200 - zoomLevel * 45;
  return Math.max(120, Math.min(900, calculated));
}

function createStatusCircle(status: ComplaintStatus, lat: number, lng: number, zoomLevel: number) {
  const color = statusColors[status] || "#6b7280";
  return L.circle([lat, lng], {
    radius: getCircleRadiusForZoom(zoomLevel),
    pane: "complaintsPane",
    color,
    weight: 4,
    opacity: 1,
    fillColor: color,
    fillOpacity: status === "resolved" ? 0.26 : 0.34,
    dashArray: status === "resolved" ? "8 8" : "",
  });
}

function complaintSignature(c: Complaint) {
  return `${c.id}|${c.status}|${c.latitude.toFixed(6)}|${c.longitude.toFixed(6)}|${c.updated_at}`;
}

function createClusterIcon(cluster: L.MarkerCluster) {
  const childMarkers = cluster.getAllChildMarkers() as ComplaintMarker[];
  let pending = 0;
  let inProgress = 0;
  let resolved = 0;

  childMarkers.forEach((marker) => {
    if (marker.complaintStatus === "pending") pending += 1;
    else if (marker.complaintStatus === "in_progress") inProgress += 1;
    else if (marker.complaintStatus === "resolved") resolved += 1;
  });

  const dominantStatus: ComplaintStatus = pending >= inProgress && pending >= resolved
    ? "pending"
    : inProgress >= resolved
      ? "in_progress"
      : "resolved";

  const color = statusColors[dominantStatus];

  return L.divIcon({
    className: "roadcare-cluster-wrap",
    html: `<div class="roadcare-cluster" style="background:${color}">${cluster.getChildCount()}</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

const BANGALORE_CENTER: [number, number] = [12.9716, 77.5946];

const TILE_LAYERS = {
  street: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  streetFallback: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
  satelliteLabels: {
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
  satelliteRoads: {
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
};

// Rate-limited reverse geocoding with max 1 request per second
let lastGeocodingTime = 0;
let geocodingPipeline: Promise<string> = Promise.resolve("");

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();

    const address = data?.address;
    const locationParts = [
      address?.road,
      address?.suburb || address?.neighbourhood,
      address?.city || address?.town || address?.village || address?.county,
      address?.state,
      address?.country,
    ].filter(Boolean);

    if (locationParts.length > 0) {
      return [...new Set(locationParts)].slice(0, 4).join(", ");
    }

    if (data?.display_name) {
      return data.display_name.split(",").slice(0, 4).join(",").trim();
    }

    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

async function queueReverseGeocode(lat: number, lng: number): Promise<string> {
  const run = async () => {
    const timeElapsed = Date.now() - lastGeocodingTime;
    if (timeElapsed < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - timeElapsed));
    }

    const value = await reverseGeocode(lat, lng);
    lastGeocodingTime = Date.now();
    return value;
  };

  geocodingPipeline = geocodingPipeline.then(run, run);
  return geocodingPipeline;
}

function buildPopupContent(c: Complaint, locationName?: string): string {
  const statusLabel = c.status.replace("_", " ");
  const statusColor = statusColors[c.status] || "#6b7280";
  const date = new Date(c.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const loc = locationName || c.address || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`;

  return `
    <div style="max-width:280px;font-family:system-ui,sans-serif">
      ${c.image_url ? `<img src="${c.image_url}" style="width:100%;border-radius:8px;margin-bottom:8px;max-height:160px;object-fit:cover" alt="${c.title}"/>` : ""}
      <h3 style="margin:0 0 4px;font-size:15px;font-weight:600">${c.title}</h3>
      <p style="font-size:12px;color:#555;margin:0 0 8px;line-height:1.4">${c.description}</p>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
        <span style="
          display:inline-flex;align-items:center;gap:4px;
          background:${statusColor}20;color:${statusColor};
          padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;
          border:1px solid ${statusColor}40;
        ">
          <span style="width:7px;height:7px;border-radius:50%;background:${statusColor}"></span>
          ${statusLabel}
        </span>
        <span style="font-size:11px;color:#888;font-weight:500">${c.priority} priority</span>
      </div>
      <div style="font-size:11px;color:#666;border-top:1px solid #eee;padding-top:6px;margin-top:4px">
        <div style="margin-bottom:2px">📍 ${loc}</div>
        <div>📅 ${date}</div>
      </div>
    </div>
  `;
}

interface MapViewProps {
  complaints: Complaint[];
  center?: [number, number];
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  selectedPosition?: [number, number] | null;
  className?: string;
}

export default function MapView({
  complaints,
  center = [20.5937, 78.9629],
  zoom = 5,
  onMapClick,
  selectedPosition,
  className,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerClusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const circlesRef = useRef<L.LayerGroup | null>(null);
  const complaintLayersRef = useRef<Map<string, ComplaintLayerEntry>>(new Map());
  const renderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoomDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationWatchIdRef = useRef<number | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const locateMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const streetLayerFailedRef = useRef(false);
  const locationCacheRef = useRef<Record<string, string>>({});
  const geolocationCalledRef = useRef(false);
  const layersRef = useRef<{
    street: L.TileLayer | null;
    streetFallback: L.TileLayer | null;
    satellite: L.TileLayer | null;
    satelliteLabels: L.TileLayer | null;
    satelliteRoads: L.TileLayer | null;
  }>({
    street: null,
    streetFallback: null,
    satellite: null,
    satelliteLabels: null,
    satelliteRoads: null,
  });
  const [isSatellite, setIsSatellite] = useState(false);
  const [locating, setLocating] = useState(false);
  const [initialLocating, setInitialLocating] = useState(true);
  const [trackingLocation, setTrackingLocation] = useState(false);

  const updateCircleRadii = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;

    const zoomLevel = map.getZoom();
    complaintLayersRef.current.forEach((entry) => {
      entry.circle.setRadius(getCircleRadiusForZoom(zoomLevel));
    });
  }, []);

  const scheduleCircleRadiusRefresh = useCallback(() => {
    if (zoomDebounceTimerRef.current) {
      clearTimeout(zoomDebounceTimerRef.current);
    }
    zoomDebounceTimerRef.current = setTimeout(() => {
      updateCircleRadii();
    }, 100);
  }, [updateCircleRadii]);

  const createComplaintLayers = useCallback((complaint: Complaint, map: L.Map): ComplaintLayerEntry => {
    const marker = L.marker([complaint.latitude, complaint.longitude], {
      icon: createMarkerIcon(complaint.status),
      riseOnHover: true,
    }) as ComplaintMarker;

    marker.complaintStatus = complaint.status;

    const cachedLocation = locationCacheRef.current[complaint.id];
    marker.bindPopup(buildPopupContent(complaint, cachedLocation), { maxWidth: 300 });

    marker.on("click", async () => {
      if (locationCacheRef.current[complaint.id]) {
        marker.setPopupContent(buildPopupContent(complaint, locationCacheRef.current[complaint.id]));
        return;
      }

      const locationName = await queueReverseGeocode(complaint.latitude, complaint.longitude);
      locationCacheRef.current[complaint.id] = locationName;
      marker.setPopupContent(buildPopupContent(complaint, locationName));
    });

    const circle = createStatusCircle(complaint.status, complaint.latitude, complaint.longitude, map.getZoom());
    return {
      marker,
      circle,
      signature: complaintSignature(complaint),
    };
  }, []);

  const updateComplaintLayers = useCallback((entry: ComplaintLayerEntry, complaint: Complaint, map: L.Map) => {
    const nextPosition = L.latLng(complaint.latitude, complaint.longitude);

    entry.marker.setLatLng(nextPosition);
    entry.marker.setIcon(createMarkerIcon(complaint.status));
    entry.marker.complaintStatus = complaint.status;
    entry.marker.setPopupContent(buildPopupContent(complaint, locationCacheRef.current[complaint.id]));

    entry.circle.setLatLng(nextPosition);
    const nextColor = statusColors[complaint.status] || "#6b7280";
    entry.circle.setStyle({
      color: nextColor,
      fillColor: nextColor,
      fillOpacity: complaint.status === "resolved" ? 0.14 : 0.18,
    });
    entry.circle.setRadius(getCircleRadiusForZoom(map.getZoom()));

    entry.signature = complaintSignature(complaint);
  }, []);

  const syncComplaintLayers = useCallback((items: Complaint[]) => {
    const map = mapInstance.current;
    const markerCluster = markerClusterRef.current;
    const circlesLayer = circlesRef.current;
    if (!map || !markerCluster || !circlesLayer) return;

    const incomingIds = new Set<string>();

    items.forEach((complaint) => {
      incomingIds.add(complaint.id);
      const signature = complaintSignature(complaint);
      const existing = complaintLayersRef.current.get(complaint.id);

      if (!existing) {
        const created = createComplaintLayers(complaint, map);
        complaintLayersRef.current.set(complaint.id, created);
        markerCluster.addLayer(created.marker);
        circlesLayer.addLayer(created.circle);
        return;
      }

      if (existing.signature !== signature) {
        updateComplaintLayers(existing, complaint, map);
      }
    });

    complaintLayersRef.current.forEach((entry, complaintId) => {
      if (incomingIds.has(complaintId)) return;

      markerCluster.removeLayer(entry.marker);
      circlesLayer.removeLayer(entry.circle);
      complaintLayersRef.current.delete(complaintId);
    });

    scheduleCircleRadiusRefresh();
  }, [createComplaintLayers, scheduleCircleRadiusRefresh, updateComplaintLayers]);

  const scheduleComplaintSync = useCallback((items: Complaint[]) => {
    if (renderTimerRef.current) {
      clearTimeout(renderTimerRef.current);
    }

    renderTimerRef.current = setTimeout(() => {
      syncComplaintLayers(items);
    }, 120);
  }, [syncComplaintLayers]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    ensureMapStyles();

    const map = L.map(mapRef.current, {
      zoomControl: false,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    }).setView(center, zoom);

    map.createPane("roadsPane");
    map.getPane("roadsPane")!.style.zIndex = "430";
    map.getPane("roadsPane")!.style.pointerEvents = "none";

    map.createPane("labelsPane");
    map.getPane("labelsPane")!.style.zIndex = "440";
    map.getPane("labelsPane")!.style.pointerEvents = "none";

    map.createPane("complaintsPane");
    map.getPane("complaintsPane")!.style.zIndex = "450";
    map.getPane("complaintsPane")!.style.pointerEvents = "none";

    L.control.zoom({ position: "bottomright" }).addTo(map);

    layersRef.current.street = L.tileLayer(TILE_LAYERS.street.url, {
      attribution: TILE_LAYERS.street.attribution,
      maxZoom: 19,
      subdomains: "abcd",
    });

    layersRef.current.streetFallback = L.tileLayer(TILE_LAYERS.streetFallback.url, {
      attribution: TILE_LAYERS.streetFallback.attribution,
      maxZoom: 19,
    });

    layersRef.current.satellite = L.tileLayer(TILE_LAYERS.satellite.url, {
      attribution: TILE_LAYERS.satellite.attribution,
      maxZoom: 19,
    });

    layersRef.current.satelliteLabels = L.tileLayer(TILE_LAYERS.satelliteLabels.url, {
      attribution: TILE_LAYERS.satelliteLabels.attribution,
      maxZoom: 19,
      pane: "labelsPane",
      opacity: 1,
    });

    layersRef.current.satelliteRoads = L.tileLayer(TILE_LAYERS.satelliteRoads.url, {
      attribution: TILE_LAYERS.satelliteRoads.attribution,
      maxZoom: 19,
      pane: "roadsPane",
      opacity: 0.95,
    });

    layersRef.current.street.addTo(map);
    layersRef.current.street.on("tileerror", () => {
      streetLayerFailedRef.current = true;
      const fallback = layersRef.current.streetFallback;
      if (fallback && !map.hasLayer(fallback)) {
        layersRef.current.street?.remove();
        fallback.addTo(map);
      }
    });

    circlesRef.current = L.layerGroup().addTo(map);
    markerClusterRef.current = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 120,
      chunkDelay: 40,
      showCoverageOnHover: false,
      removeOutsideVisibleBounds: true,
      disableClusteringAtZoom: 16,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: createClusterIcon,
    }).addTo(map);

    map.on("zoomend", scheduleCircleRadiusRefresh);

    mapInstance.current = map;

    if (onMapClick) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      if (renderTimerRef.current) {
        clearTimeout(renderTimerRef.current);
      }
      if (zoomDebounceTimerRef.current) {
        clearTimeout(zoomDebounceTimerRef.current);
      }
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
      if (locateMarkerRef.current) {
        locateMarkerRef.current.remove();
        locateMarkerRef.current = null;
      }
      map.off("zoomend", scheduleCircleRadiusRefresh);
      map.remove();
      mapInstance.current = null;
      markerClusterRef.current = null;
      circlesRef.current = null;
      complaintLayersRef.current.clear();
    };
  }, [center, zoom, onMapClick, scheduleCircleRadiusRefresh]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || geolocationCalledRef.current) return;
    geolocationCalledRef.current = true;
    setInitialLocating(true);

    const onSuccess = (position: GeolocationPosition) => {
      if (mapInstance.current) {
        mapInstance.current.flyTo([position.coords.latitude, position.coords.longitude], 12, { duration: 0.8 });
      }
      setInitialLocating(false);
    };

    const onError = () => {
      if (mapInstance.current) {
        mapInstance.current.setView(BANGALORE_CENTER, 10);
      }
      setInitialLocating(false);
    };

    if (!navigator.geolocation) {
      onError();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    const { street, streetFallback, satellite, satelliteLabels, satelliteRoads } = layersRef.current;
    if (!map || !street || !satellite || !satelliteLabels || !satelliteRoads || !streetFallback) return;

    street.remove();
    streetFallback.remove();
    satellite.remove();
    satelliteLabels.remove();
    satelliteRoads.remove();

    if (isSatellite) {
      satellite.addTo(map);
      satelliteRoads.addTo(map);
      satelliteLabels.addTo(map);
    } else {
      if (streetLayerFailedRef.current) {
        streetFallback.addTo(map);
      } else {
        street.addTo(map);
      }
    }
  }, [isSatellite]);

  useEffect(() => {
    const validComplaints = complaints.filter((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude));
    scheduleComplaintSync(validComplaints);
  }, [complaints, scheduleComplaintSync]);

  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    if (selectedPosition) {
      selectedMarkerRef.current = L.marker(selectedPosition, {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:hsl(220,70%,25%);width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4)"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      }).addTo(mapInstance.current);
      mapInstance.current.flyTo(selectedPosition, 15, { duration: 0.75 });
    }
  }, [selectedPosition]);

  const handleLocate = useCallback(() => {
    if (!mapInstance.current) return;
    setLocating(true);
    setTrackingLocation(true);

    if (locationWatchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }

    const renderTrackedPosition = (pos: GeolocationPosition, centerMap: boolean) => {
      const map = mapInstance.current;
      if (!map) return;

      const { latitude, longitude, accuracy } = pos.coords;
      const latLng = L.latLng(latitude, longitude);

      if (!locateMarkerRef.current) {
        locateMarkerRef.current = L.marker(latLng, {
          icon: L.divIcon({
            className: "",
            html: `<div style="
              width:18px;height:18px;border-radius:50%;
              background:hsl(220,70%,50%);
              border:3px solid white;
              box-shadow:0 0 0 7px hsla(220,70%,50%,0.22), 0 2px 10px rgba(0,0,0,0.28);
            "></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
        }).addTo(map);
      } else {
        locateMarkerRef.current.setLatLng(latLng);
      }

      if (!userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current = L.circle(latLng, {
          pane: "complaintsPane",
          radius: Math.max(accuracy || 25, 25),
          color: "#2563eb",
          weight: 1,
          opacity: 0.8,
          fillColor: "#60a5fa",
          fillOpacity: 0.12,
        }).addTo(map);
      } else {
        userAccuracyCircleRef.current.setLatLng(latLng);
        userAccuracyCircleRef.current.setRadius(Math.max(accuracy || 25, 25));
      }

      if (centerMap) {
        map.flyTo(latLng, 16, { duration: 0.6 });
      }
    };

    const onSuccess = (pos: GeolocationPosition) => {
      renderTrackedPosition(pos, true);
      setLocating(false);
    };

    const onError = () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
      const map = mapInstance.current;
      if (map) {
        map.flyTo(BANGALORE_CENTER, 11, { duration: 0.8 });
      }
      setLocating(false);
      setTrackingLocation(false);
    };

    if (!navigator.geolocation) {
      onError();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        renderTrackedPosition(position, true);
        setLocating(false);
        setTrackingLocation(true);
      },
      onError,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
  }, []);

  return (
    <div className={`relative ${className || "h-[500px] w-full rounded-xl border"}`}>
      <div ref={mapRef} className="h-full w-full rounded-xl" />

      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => setIsSatellite((value) => !value)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-md transition-colors ${
            isSatellite
              ? "bg-accent text-accent-foreground border-accent"
              : "bg-background/90 text-foreground border-border backdrop-blur-sm hover:bg-accent"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          {isSatellite ? "Street" : "Satellite"}
        </button>
        <button
          onClick={handleLocate}
          disabled={locating}
          className="flex items-center gap-1.5 rounded-lg bg-background/90 backdrop-blur-sm border border-border px-3 py-1.5 text-xs font-medium text-foreground shadow-md hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Locate className={`h-3.5 w-3.5 ${locating || trackingLocation ? "animate-pulse" : ""}`} />
          {locating ? "Locating…" : trackingLocation ? "Tracking" : "My Location"}
        </button>
      </div>

      {initialLocating && (
        <div className="absolute top-3 left-3 z-[1000] rounded-lg border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-sm">
          Detecting your location...
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-background/90 backdrop-blur-sm border border-border px-3 py-2 shadow-md">
        <div className="flex gap-3 text-[11px] font-medium text-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive inline-block" /> Pending
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-accent inline-block" /> In Progress
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-success inline-block" /> Resolved
          </span>
        </div>
      </div>
    </div>
  );
}
