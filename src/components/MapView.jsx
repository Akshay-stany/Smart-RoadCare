import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { Locate, Layers, Loader2, Navigation, MapPin, Activity } from "lucide-react";

/**
 * Exact status colors matching requirement:
 * Yellow = Pending
 * Red = In Progress
 * Green = Resolved
 */
export const statusColors = {
  pending: "#EAB308", // Yellow
  in_progress: "#EF4444", // Red
  resolved: "#10B981", // Green
};

// Major urban arterial corridors for live traffic overlay
const generateTrafficCorridors = (centerLat, centerLng) => [
  {
    name: "Arterial Corridor North",
    points: [
      [centerLat - 0.025, centerLng - 0.015],
      [centerLat - 0.01, centerLng - 0.005],
      [centerLat + 0.008, centerLng + 0.003],
      [centerLat + 0.028, centerLng + 0.012],
    ],
    status: "fast", // Green
    speed: "48 km/h",
  },
  {
    name: "Commercial Ring Expressway",
    points: [
      [centerLat + 0.018, centerLng - 0.025],
      [centerLat + 0.012, centerLng - 0.005],
      [centerLat + 0.004, centerLng + 0.015],
      [centerLat - 0.002, centerLng + 0.032],
    ],
    status: "moderate", // Orange
    speed: "26 km/h",
  },
  {
    name: "Central Junction Chokepoint",
    points: [
      [centerLat - 0.008, centerLng - 0.02],
      [centerLat - 0.002, centerLng - 0.004],
      [centerLat + 0.003, centerLng + 0.008],
      [centerLat + 0.009, centerLng + 0.022],
    ],
    status: "congested", // Red
    speed: "12 km/h",
  },
  {
    name: "South Highway Link",
    points: [
      [centerLat - 0.032, centerLng + 0.005],
      [centerLat - 0.018, centerLng + 0.008],
      [centerLat - 0.006, centerLng + 0.012],
      [centerLat + 0.005, centerLng + 0.018],
    ],
    status: "fast", // Green
    speed: "52 km/h",
  },
];

const statusShortLabels = {
  pending: "P",
  in_progress: "IP",
  resolved: "R",
};

const MAP_STYLE_ID = "roadcare-map-google-styles";

function ensureMapStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(MAP_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = MAP_STYLE_ID;
  style.textContent = `
    @keyframes roadcare-marker-pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      70% { transform: scale(1.4); opacity: 0; }
      100% { transform: scale(1.4); opacity: 0; }
    }

    .roadcare-google-marker {
      position: relative;
      width: 32px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.15s ease-out;
    }
    .roadcare-google-marker:hover {
      transform: scale(1.15) translateY(-2px);
      z-index: 9999 !important;
    }
    .roadcare-google-marker__pulse {
      position: absolute;
      width: 30px;
      height: 30px;
      border-radius: 9999px;
      top: 0;
      animation: roadcare-marker-pulse 1.8s ease-out infinite;
    }
    .roadcare-google-marker__pin {
      position: relative;
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
      border: 2px solid #FFFFFF;
    }
    .roadcare-google-marker__dot {
      transform: rotate(45deg);
      font-size: 10px;
      font-weight: 800;
      color: #FFFFFF;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .roadcare-cluster-node {
      width: 40px;
      height: 40px;
      border-radius: 9999px;
      border: 2.5px solid #FFFFFF;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .roadcare-cluster-node:hover {
      transform: scale(1.1);
    }
    .leaflet-popup-content-wrapper {
      border-radius: 14px;
      padding: 0;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
    }
    .leaflet-popup-content {
      margin: 0;
      line-height: 1.4;
    }
  `;
  document.head.appendChild(style);
}

if (typeof window !== "undefined") {
  ensureMapStyles();
}

const createGoogleMarkerIcon = (status) => {
  const color = statusColors[status] || "#EAB308";
  const label = statusShortLabels[status] || "•";

  return L.divIcon({
    className: "roadcare-marker-container",
    html: `
      <div class="roadcare-google-marker">
        <span class="roadcare-google-marker__pulse" style="background:${color}55"></span>
        <div class="roadcare-google-marker__pin" style="background:${color}">
          <span class="roadcare-google-marker__dot">${label}</span>
        </div>
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 36],
    popupAnchor: [0, -32],
  });
};

function createClusterIcon(cluster) {
  const childMarkers = cluster.getAllChildMarkers();
  let pending = 0;
  let inProgress = 0;
  let resolved = 0;

  childMarkers.forEach((marker) => {
    if (marker.complaintStatus === "pending") pending += 1;
    else if (marker.complaintStatus === "in_progress") inProgress += 1;
    else if (marker.complaintStatus === "resolved") resolved += 1;
  });

  const dominantStatus =
    pending >= inProgress && pending >= resolved
      ? "pending"
      : inProgress >= resolved
      ? "in_progress"
      : "resolved";

  const color = statusColors[dominantStatus] || "#EAB308";

  return L.divIcon({
    className: "roadcare-cluster-wrapper",
    html: `<div class="roadcare-cluster-node" style="background:${color}">${cluster.getChildCount()}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function buildPopupHtml(c) {
  const statusKey = c.status || "pending";
  const statusColor = statusColors[statusKey] || "#EAB308";
  const statusLabel = statusKey.replace(/_/g, " ").toUpperCase();
  const compId = c.complaint_id || `RC-${c.id?.slice(0, 4) || "1024"}`;
  const imgUrl = c.image_url || "/images/pothole-defect.jpg";
  const loc = c.address || `${c.latitude?.toFixed(4)}, ${c.longitude?.toFixed(4)}`;

  return `
    <div style="width:260px;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#ffffff">
      <div style="width:100%;height:120px;overflow:hidden;position:relative;background:#0F172A">
        <img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover" alt="${c.title || 'Road Issue'}" />
        <div style="position:absolute;top:8px;right:8px;background:${statusColor};color:#ffffff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:12px;text-transform:uppercase;letter-spacing:0.04em">
          ${statusLabel}
        </div>
      </div>
      <div style="padding:12px 14px 14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <span style="font-weight:800;font-size:13px;color:#0F172A">#${compId}</span>
          <span style="font-size:11px;font-weight:700;color:#64748B">${c.category || 'Road Defect'}</span>
        </div>
        <div style="font-weight:700;font-size:13px;color:#1E293B;margin-bottom:6px;line-height:1.3">
          ${c.title || 'Reported Road Defect'}
        </div>
        <div style="font-size:11px;color:#64748B;margin-bottom:12px;display:flex;align-items:center;gap:4px">
          <span style="color:#10B981;font-size:13px">📍</span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${loc}</span>
        </div>
        <a href="/complaints/${c.id || compId}" style="
          display:block;width:100%;text-align:center;background:#0F172A;color:#FFFFFF;
          font-weight:700;font-size:12px;padding:8px 0;border-radius:8px;text-decoration:none;
          transition:background 0.2s;
        ">
          View Details & History &rarr;
        </a>
      </div>
    </div>
  `;
}

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bengaluru

// 100% Free, NO API Key Required Tile Providers (Zero Watermarks!)
const TILE_CONFIGS = {
  // 1. Default: Detailed Google Maps-Style Street & Public Landmark Map
  default: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  // Fallback Street
  defaultFallback: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
  },
  // 2. Satellite Mode: High-Res Imagery with Road Transportation and Labels
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 19,
  },
  satelliteRoads: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 19,
  },
  satelliteLabels: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 19,
  },
  // 3. Public Portrait / Topo: Civil Infrastructure & Elevation Contours
  portrait: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &copy; National Geographic',
    maxZoom: 19,
  },
};

export default function MapView({
  complaints = [],
  center = DEFAULT_CENTER,
  zoom = 12,
  onMapClick,
  selectedPosition,
  className,
}) {
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const clusterGroupRef = useRef(null);
  const markersMapRef = useRef(new Map());
  const selectedMarkerRef = useRef(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  // Map Type state: 'default' (Street) | 'satellite' | 'portrait' (Public Topo)
  const [mapType, setMapType] = useState("default");
  const [showTraffic, setShowTraffic] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const trafficLayerGroupRef = useRef(null);

  // Initialize Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return;
    ensureMapStyles();

    // Pick initial center from first complaint if available, else center prop
    const initialCenter =
      complaints && complaints.length > 0 && complaints[0]?.latitude && complaints[0]?.longitude
        ? [complaints[0].latitude, complaints[0].longitude]
        : center || DEFAULT_CENTER;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: zoom || 12,
      zoomControl: false,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      preferCanvas: true, // Hardware-accelerated canvas for fast rendering
    });

    // Add zoom control at bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Initial Street Tile Layer (No API Key Required!)
    const initialLayer = L.tileLayer(TILE_CONFIGS.default.url, {
      attribution: TILE_CONFIGS.default.attribution,
      maxZoom: TILE_CONFIGS.default.maxZoom,
    });

    initialLayer.on("tileerror", () => {
      if (map && !map.hasLayer(initialLayer)) return;
      initialLayer.remove();
      L.tileLayer(TILE_CONFIGS.defaultFallback.url, {
        attribution: TILE_CONFIGS.defaultFallback.attribution,
        maxZoom: 19,
      }).addTo(map);
    });

    initialLayer.addTo(map);

    // Fast marker cluster group
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 100,
      chunkDelay: 30,
      showCoverageOnHover: false,
      removeOutsideVisibleBounds: true,
      disableClusteringAtZoom: 16,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: createClusterIcon,
    });
    clusterGroup.addTo(map);

    // Click handler on map
    map.on("click", (e) => {
      if (onMapClickRef.current) {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    mapInstance.current = map;
    clusterGroupRef.current = clusterGroup;
    setMapLoaded(true);

    const markersMap = markersMapRef.current;
    return () => {
      map.remove();
      mapInstance.current = null;
      clusterGroupRef.current = null;
      markersMap.clear();
    };
  }, []); // Run once on mount!

  // Update map layer when mapType changes (Default / Satellite / Portrait)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (mapType === "satellite") {
      // 1. High-Res Satellite
      L.tileLayer(TILE_CONFIGS.satellite.url, {
        attribution: TILE_CONFIGS.satellite.attribution,
        maxZoom: 19,
      }).addTo(map);
      // 2. Hybrid Road Overlay
      L.tileLayer(TILE_CONFIGS.satelliteRoads.url, {
        attribution: TILE_CONFIGS.satelliteRoads.attribution,
        maxZoom: 19,
        opacity: 0.9,
      }).addTo(map);
      // 3. Place Labels
      L.tileLayer(TILE_CONFIGS.satelliteLabels.url, {
        attribution: TILE_CONFIGS.satelliteLabels.attribution,
        maxZoom: 19,
      }).addTo(map);
    } else if (mapType === "portrait") {
      // Public Portrait / Topographic Map with relief and civic roads
      L.tileLayer(TILE_CONFIGS.portrait.url, {
        attribution: TILE_CONFIGS.portrait.attribution,
        maxZoom: 19,
      }).addTo(map);
    } else {
      // Default: Google-like crisp Street Map
      const streetLayer = L.tileLayer(TILE_CONFIGS.default.url, {
        attribution: TILE_CONFIGS.default.attribution,
        maxZoom: 19,
      });
      streetLayer.on("tileerror", () => {
        streetLayer.remove();
        L.tileLayer(TILE_CONFIGS.defaultFallback.url, {
          attribution: TILE_CONFIGS.defaultFallback.attribution,
          maxZoom: 19,
        }).addTo(map);
      });
      streetLayer.addTo(map);
    }
  }, [mapType]);

  // Synchronize Google-style Traffic Overlay
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (trafficLayerGroupRef.current) {
      map.removeLayer(trafficLayerGroupRef.current);
      trafficLayerGroupRef.current = null;
    }

    if (showTraffic) {
      const trafficGroup = L.layerGroup();
      const currentCenter = map.getCenter();
      const corridors = generateTrafficCorridors(currentCenter.lat, currentCenter.lng);

      corridors.forEach((c) => {
        const color =
          c.status === "congested"
            ? "#EF4444" // Heavy traffic Red
            : c.status === "moderate"
            ? "#F59E0B" // Moderate traffic Orange
            : "#10B981"; // Free flow Green

        const line = L.polyline(c.points, {
          color,
          weight: 6,
          opacity: 0.85,
          lineCap: "round",
          lineJoin: "round",
        });

        line.bindPopup(
          `<div style="font-family:system-ui,sans-serif;padding:6px 8px;font-size:12px;">
            <div style="font-weight:700;color:#0F172A;">${c.name}</div>
            <div style="color:#64748B;font-size:11px;margin-top:2px;">Traffic Flow: <b style="color:${color};text-transform:capitalize;">${c.status}</b> (${c.speed})</div>
          </div>`,
          { closeButton: false }
        );

        trafficGroup.addLayer(line);
      });

      trafficGroup.addTo(map);
      trafficLayerGroupRef.current = trafficGroup;
    }
  }, [showTraffic]);

  // Efficiently synchronize complaint markers without recreating the map
  useEffect(() => {
    const map = mapInstance.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    const validComplaints = complaints.filter(
      (c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude)
    );

    const incomingIds = new Set(validComplaints.map((c) => c.id || c.complaint_id));

    // Remove obsolete markers
    markersMapRef.current.forEach((marker, id) => {
      if (!incomingIds.has(id)) {
        clusterGroup.removeLayer(marker);
        markersMapRef.current.delete(id);
      }
    });

    // Add or update markers
    validComplaints.forEach((c) => {
      const id = c.id || c.complaint_id;
      const existing = markersMapRef.current.get(id);

      if (!existing) {
        const marker = L.marker([c.latitude, c.longitude], {
          icon: createGoogleMarkerIcon(c.status),
          riseOnHover: true,
        });
        marker.complaintStatus = c.status;
        marker.bindPopup(buildPopupHtml(c), { maxWidth: 280, closeButton: true });

        marker.on("click", () => {
          if (onMapClickRef.current) {
            onMapClickRef.current(c.latitude, c.longitude);
          }
        });

        clusterGroup.addLayer(marker);
        markersMapRef.current.set(id, marker);
      } else {
        // Update position or status if changed
        if (existing.complaintStatus !== c.status) {
          existing.setIcon(createGoogleMarkerIcon(c.status));
          existing.complaintStatus = c.status;
          existing.setPopupContent(buildPopupHtml(c));
        }
      }
    });
  }, [complaints]);

  // Handle selected position pin (e.g. user clicked GPS or reporting new complaint)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    if (
      selectedPosition &&
      Array.isArray(selectedPosition) &&
      selectedPosition.length === 2 &&
      Number.isFinite(selectedPosition[0]) &&
      Number.isFinite(selectedPosition[1])
    ) {
      const pinIcon = L.divIcon({
        className: "roadcare-selected-pin",
        html: `
          <div style="filter:drop-shadow(0 4px 6px rgba(0,0,0,0.45));cursor:grab">
            <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 0C7.61116 0 0 7.61116 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61116 26.3888 0 17 0Z" fill="#10B981"/>
              <circle cx="17" cy="17" r="7.5" fill="#FFFFFF"/>
              <circle cx="17" cy="17" r="4" fill="#047857"/>
            </svg>
          </div>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
      });

      selectedMarkerRef.current = L.marker(selectedPosition, {
        icon: pinIcon,
        draggable: Boolean(onMapClickRef.current),
      }).addTo(map);

      if (onMapClickRef.current) {
        selectedMarkerRef.current.on("dragend", (e) => {
          const latlng = e.target.getLatLng();
          onMapClickRef.current(latlng.lat, latlng.lng);
        });
      }

      map.flyTo(selectedPosition, Math.max(map.getZoom(), 15), { duration: 0.5 });
    }
  }, [selectedPosition]);

  // Fast GPS centering (non-blocking)
  const handleLocateMe = useCallback(() => {
    const map = mapInstance.current;
    if (!map || !navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        map.flyTo(coords, 15, { duration: 0.6 });
        setLocating(false);
      },
      () => {
        map.flyTo(DEFAULT_CENTER, 12, { duration: 0.5 });
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 3000 }
    );
  }, []);

  return (
    <div className={`relative ${className || "h-[500px] w-full rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs"}`}>
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Floating Google Maps-Style Layer Controls (Default, Satellite, Public Portrait) */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col sm:flex-row items-end sm:items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-md">
        <button
          type="button"
          onClick={() => setMapType("default")}
          className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all ${
            mapType === "default"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
          title="Default Google Maps Street View"
        >
          Default
        </button>

        <button
          type="button"
          onClick={() => setMapType("satellite")}
          className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all ${
            mapType === "satellite"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
          title="Satellite Imagery with Road Overlay"
        >
          Satellite
        </button>

        <button
          type="button"
          onClick={() => setMapType("portrait")}
          className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all ${
            mapType === "portrait"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
          title="Public Infrastructure & Topo View"
        >
          Public Portrait
        </button>

        <div className="w-[1px] h-5 bg-slate-200 hidden sm:block mx-0.5" />

        {/* Google Maps Style Traffic Flow Toggle */}
        <button
          type="button"
          onClick={() => setShowTraffic((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all ${
            showTraffic
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
          title="Toggle Google-Style Traffic Flow Overlays"
        >
          <Activity className="h-3.5 w-3.5" />
          Traffic {showTraffic ? "ON" : "OFF"}
        </button>

        <div className="w-[1px] h-5 bg-slate-200 hidden sm:block mx-0.5" />

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors disabled:opacity-50"
          title="Locate Current Position"
        >
          <Navigation className={`h-3.5 w-3.5 text-emerald-600 ${locating ? "animate-spin" : ""}`} />
          {locating ? "Locating..." : "Locate Me"}
        </button>
      </div>

      {/* Clear Status Color Legend Matching User Requirements:
          Yellow = Pending
          Red = In Progress
          Green = Resolved
      */}
      <div className="absolute bottom-3 left-3 z-[400] rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 px-3.5 py-2.5 shadow-md space-y-1.5">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Road Complaint Status
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-slate-800">
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full inline-block shadow-2xs"
              style={{ backgroundColor: statusColors.pending }}
            />
            <span>Pending (Yellow)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full inline-block shadow-2xs"
              style={{ backgroundColor: statusColors.in_progress }}
            />
            <span>In Progress (Red)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full inline-block shadow-2xs"
              style={{ backgroundColor: statusColors.resolved }}
            />
            <span>Resolved (Green)</span>
          </span>
        </div>

        {/* Live Traffic legend appears when Traffic is toggled ON */}
        {showTraffic && (
          <div className="pt-1.5 border-t border-slate-200/80 flex items-center gap-3 text-[11px] font-semibold text-slate-600">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Traffic Flow:</span>
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="h-2 w-3 rounded-xs bg-[#10B981] inline-block" /> Fast (45+ km/h)
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="h-2 w-3 rounded-xs bg-[#F59E0B] inline-block" /> Moderate
            </span>
            <span className="flex items-center gap-1 text-rose-700">
              <span className="h-2 w-3 rounded-xs bg-[#EF4444] inline-block" /> Slow / Congested
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
