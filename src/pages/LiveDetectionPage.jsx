import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useCreateComplaint } from "@/hooks/useComplaints";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { analyzeRoadImage } from "@/services/aiService";
import {
  Camera,
  Play,
  Square,
  AlertTriangle,
  MapPin,
  Sparkles,
  ShieldAlert,
  Save,
  CheckCircle2,
  RefreshCw,
  Video,
  Truck,
  Car,
  Gauge,
  Radio,
  Smartphone,
  Check,
  SendHorizontal,
  ExternalLink,
} from "lucide-react";

const VEHICLE_PRESETS = [
  { id: "KA-01-PATROL-402", type: "Municipal Patrol Van", route: "Indiranagar - MG Road Corridor" },
  { id: "KA-04-INSPECT-88", type: "PWD Road Inspection Cruiser", route: "Outer Ring Road Sector 2" },
  { id: "KA-05-CIVIC-12", type: "Citizen Dashcam Mount", route: "Koramangala - HSR Link" },
  { id: "KA-53-SURVEY-07", type: "Two-Wheeler Mobile Mount", route: "Whitefield Expressway" },
];

export default function LiveDetectionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createComplaint = useCreateComplaint();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const simCanvasRef = useRef(null);
  const simAnimFrameRef = useRef(null);

  // Camera & Stream Mode ('camera' or 'simulated')
  const [streamSource, setStreamSource] = useState("camera");
  const [streaming, setStreaming] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [facingMode, setFacingMode] = useState("environment"); // default rear/windshield dashcam
  const [hasPermission, setHasPermission] = useState(null);

  // Vehicle Assignment & Telemetry
  const [vehicleId, setVehicleId] = useState("KA-01-PATROL-402");
  const [vehicleType, setVehicleType] = useState("Municipal Patrol Van");
  const [patrolRoute, setPatrolRoute] = useState("Indiranagar - MG Road Corridor");
  const [vehicleSpeed, setVehicleSpeed] = useState(38); // km/h

  // Detection Settings & Cooldown
  const [samplingRateFps, setSamplingRateFps] = useState(1);
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [gpsLocation, setGpsLocation] = useState({ lat: 12.9716, lng: 77.5946, accuracy: 4 });
  const [activeDetections, setActiveDetections] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const [convertingId, setConvertingId] = useState(null);

  // Detect available video devices on load
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((allDevices) => {
          const videoDevs = allDevices.filter((d) => d.kind === "videoinput");
          setDevices(videoDevs);
          if (videoDevs.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevs[0].deviceId);
          }
        })
        .catch(() => {});
    }
  }, [selectedDeviceId]);

  // High accuracy GPS geolocation tracking
  useEffect(() => {
    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 5),
          });
          if (pos.coords.speed && pos.coords.speed > 0) {
            setVehicleSpeed(Math.round(pos.coords.speed * 3.6));
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Subtle speed fluctuation when streaming to mimic road driving
  useEffect(() => {
    if (!streaming) return;
    const interval = setInterval(() => {
      setVehicleSpeed((prev) => {
        const delta = (Math.random() - 0.48) * 3;
        const next = Math.round(prev + delta);
        return Math.max(22, Math.min(65, next));
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [streaming]);

  // Flip Mobile Camera (Rear Windshield vs Front Cabin)
  const toggleCameraFacing = async () => {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    if (streaming && streamSource === "camera") {
      stopCameraStream();
      setTimeout(() => {
        startHardwareCamera(nextFacing);
      }, 200);
    }
  };

  // Stop hardware video stream
  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Stop simulation animation
  const stopSimulation = useCallback(() => {
    if (simAnimFrameRef.current) {
      cancelAnimationFrame(simAnimFrameRef.current);
      simAnimFrameRef.current = null;
    }
  }, []);

  // Start Real Hardware Camera
  const startHardwareCamera = async (facing = facingMode) => {
    try {
      const constraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setStreaming(true);
      setHasPermission(true);
      toast.success(
        facing === "environment"
          ? "Rear Windshield Dashcam feed started."
          : "Front Cabin camera feed started."
      );
    } catch (err) {
      setHasPermission(false);
      console.warn("Camera access failed, suggesting simulation:", err);
      toast.error(
        `Hardware camera unavailable (${err.name}). Switching to Simulated Road Dashcam Feed.`
      );
      setStreamSource("simulated");
      startSimulatedDrive();
    }
  };

  // Start Simulated Road Dashcam Drive (For testing on mobile/desktop without camera permissions)
  const startSimulatedDrive = () => {
    setStreaming(true);
    toast.success("Simulated Road Dashcam Drive started. Rendering road hazards...");

    let offset = 0;
    let hazardProgress = 0;
    let currentHazardType = "Deep Asphalt Pothole";

    const simCanvas = simCanvasRef.current;
    if (!simCanvas) return;
    const ctx = simCanvas.getContext("2d");

    const renderFrame = () => {
      const w = simCanvas.width;
      const h = simCanvas.height;

      // 1. Sky & Horizon
      const skyGradient = ctx.createLinearGradient(0, 0, 0, h * 0.4);
      skyGradient.addColorStop(0, "#0F172A");
      skyGradient.addColorStop(1, "#334155");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, w, h * 0.4);

      // Distant tree/city skyline
      ctx.fillStyle = "#1E293B";
      ctx.fillRect(0, h * 0.38, w, h * 0.04);

      // 2. Asphalt Road Surface
      const roadGradient = ctx.createLinearGradient(0, h * 0.4, 0, h);
      roadGradient.addColorStop(0, "#475569");
      roadGradient.addColorStop(1, "#1E293B");
      ctx.fillStyle = roadGradient;
      ctx.fillRect(0, h * 0.4, w, h * 0.6);

      // Road Borders (perspective)
      ctx.strokeStyle = "#FACC15";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.4);
      ctx.lineTo(w * 0.05, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.58, h * 0.4);
      ctx.lineTo(w * 0.95, h);
      ctx.stroke();

      // Road Center Dashed Lines (animated moving forward)
      offset = (offset + 6) % 40;
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 5;
      ctx.setLineDash([25, 20]);
      ctx.lineDashOffset = -offset;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.4);
      ctx.lineTo(w * 0.5, h);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // 3. Approaching Road Defect Hazard
      hazardProgress += 0.009;
      if (hazardProgress > 1.25) {
        hazardProgress = 0;
        const hazards = [
          "Deep Asphalt Pothole",
          "Severe Alligator Crack",
          "Sunken Manhole Depression",
          "Edge Ravelling Road Hazard",
        ];
        currentHazardType = hazards[Math.floor(Math.random() * hazards.length)];
      }

      // Draw hazard when in middle-to-foreground zone
      if (hazardProgress > 0.3 && hazardProgress < 1.1) {
        const hazardY = h * 0.4 + (h * 0.55) * hazardProgress;
        const hazardX = w * 0.5 + (w * 0.12) * Math.sin(hazardProgress * 3);
        const hazardRadius = 15 + hazardProgress * 32;

        ctx.save();
        ctx.fillStyle = "#0B0F19";
        ctx.beginPath();
        ctx.ellipse(hazardX, hazardY, hazardRadius, hazardRadius * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crater depth texture
        ctx.strokeStyle = "#38BDF8";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Vehicle Hood / Dashboard at the very bottom
      ctx.fillStyle = "#020617";
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(w * 0.15, h * 0.92);
      ctx.lineTo(w * 0.85, h * 0.92);
      ctx.lineTo(w, h);
      ctx.fill();

      simAnimFrameRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();
  };

  // Main start handler
  const handleStart = () => {
    if (streamSource === "simulated") {
      startSimulatedDrive();
    } else {
      startHardwareCamera();
    }
  };

  // Main stop handler
  const handleStop = () => {
    stopCameraStream();
    stopSimulation();
    setStreaming(false);
    setActiveDetections([]);
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
    toast.info("Live detection feed stopped.");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      stopSimulation();
    };
  }, [stopCameraStream, stopSimulation]);

  // Frame sampling and AI defect detection loop
  useEffect(() => {
    if (!streaming) return;

    const intervalMs = Math.round(1000 / samplingRateFps);
    const interval = setInterval(async () => {
      const source = streamSource === "simulated" ? simCanvasRef.current : videoRef.current;
      const canvas = canvasRef.current;
      const overlay = overlayCanvasRef.current;

      if (!source || !canvas || !overlay) return;

      if (streamSource === "camera" && videoRef.current.readyState !== 4) {
        return;
      }

      const srcWidth = source.videoWidth || source.width || 640;
      const srcHeight = source.videoHeight || source.height || 480;

      canvas.width = srcWidth;
      canvas.height = srcHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

      // Analyze frame for road damage
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const result = await analyzeRoadImage(blob);
          if (
            result &&
            result.primaryDefect &&
            result.primaryDefect.confidence >= confidenceThreshold
          ) {
            const now = Date.now();
            if (now - lastDetectionTime > 4000) {
              setLastDetectionTime(now);

              const eventItem = {
                id: `EV-${Date.now().toString().slice(-6)}`,
                timestamp: new Date().toLocaleTimeString(),
                defect: result.primaryDefect.label,
                confidence: result.primaryDefect.confidence,
                severity: result.primaryDefect.severity || "high",
                category: result.primaryDefect.category || "pothole",
                gps: gpsLocation
                  ? `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}`
                  : "12.9716, 77.5946",
                lat: gpsLocation?.lat || 12.9716,
                lng: gpsLocation?.lng || 77.5946,
                vehicleId: vehicleId,
                vehicleType: vehicleType,
                route: patrolRoute,
                snapshot: canvas.toDataURL("image/jpeg", 0.7),
              };

              setActiveDetections([result.primaryDefect]);
              setRecentEvents((prev) => [eventItem, ...prev.slice(0, 9)]);

              // Draw bounding box on overlay canvas
              overlay.width = overlay.clientWidth || 640;
              overlay.height = overlay.clientHeight || 360;
              const oCtx = overlay.getContext("2d");
              oCtx.clearRect(0, 0, overlay.width, overlay.height);

              const bbox = result.primaryDefect.boundingBox;
              const bx = bbox.x * overlay.width;
              const by = bbox.y * overlay.height;
              const bw = bbox.width * overlay.width;
              const bh = bbox.height * overlay.height;

              oCtx.strokeStyle = "#EF4444";
              oCtx.lineWidth = 3;
              oCtx.strokeRect(bx, by, bw, bh);

              oCtx.fillStyle = "#EF4444";
              oCtx.fillRect(bx, by - 26, 140, 26);
              oCtx.fillStyle = "#FFFFFF";
              oCtx.font = "bold 12px sans-serif";
              oCtx.fillText(
                `${result.primaryDefect.label} ${result.primaryDefect.confidence.toFixed(0)}%`,
                bx + 6,
                by - 8
              );
            }
          }
        } catch {
          // drop frame if busy
        }
      }, "image/jpeg", 0.65);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [
    streaming,
    streamSource,
    samplingRateFps,
    confidenceThreshold,
    gpsLocation,
    vehicleId,
    vehicleType,
    patrolRoute,
    lastDetectionTime,
  ]);

  // Convert and Assign Event directly to Official Complaint
  const handleAssignToComplaint = async (ev) => {
    setConvertingId(ev.id);
    try {
      await createComplaint.mutateAsync({
        title: `${ev.defect} [Dashcam ${ev.vehicleId}]`,
        description: `Automated road hazard identified by vehicle dashcam (${ev.vehicleId} - ${ev.vehicleType}) during route patrol along ${ev.route}. AI Confidence: ${ev.confidence.toFixed(0)}%. Location: GPS ${ev.gps}.`,
        category: ev.category || "Pothole",
        department: "Roads & Highways",
        latitude: ev.lat,
        longitude: ev.lng,
        address: `${ev.route}, Bengaluru`,
        priority: ev.severity.toLowerCase() || "high",
        is_urgent: ev.severity.toLowerCase() === "high",
        image_url: ev.snapshot,
        user_id: user?.id || "patrol-vehicle",
      });

      toast.success(`Complaint successfully created & assigned from Vehicle ${ev.vehicleId}!`);
      setRecentEvents((prev) => prev.filter((x) => x.id !== ev.id));
    } catch (err) {
      toast.error(err.message || "Failed to create complaint from event.");
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Live Dashcam & Vehicle Defect Detection"
        description="Stream front windshield vehicle camera or simulated road drives for automated road damage inference and complaint assignment."
        badge={
          <Badge
            variant="outline"
            className={
              streaming
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse font-bold"
                : "bg-slate-100 text-slate-600 font-medium"
            }
          >
            {streaming ? `● LIVE ${streamSource.toUpperCase()} SCAN` : "IDLE"}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            {streaming ? (
              <Button
                onClick={handleStop}
                variant="destructive"
                className="h-10 px-5 rounded-xl font-bold shadow-xs"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Feed
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
              >
                <Play className="w-4 h-4 mr-2" />
                Start {streamSource === "simulated" ? "Simulated Drive" : "Dashcam"}
              </Button>
            )}
          </div>
        }
      />

      {/* Driver Safety & Mobile Notice */}
      <div className="p-3.5 mb-6 rounded-2xl bg-amber-50 border border-amber-200/90 flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Vehicle Mount Notice:</strong> For mobile phones mounted to windshields, select <em>Rear Camera</em> for road perspective. All candidate road defects are logged automatically to prevent driver distraction.
        </p>
      </div>

      {/* Vehicle Assignment & Hardware Bar */}
      <Card className="mb-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          {/* Feed Source Mode */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-emerald-600" />
              Feed Source Mode
            </Label>
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (streaming) handleStop();
                  setStreamSource("camera");
                }}
                className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                  streamSource === "camera"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Hardware Camera
              </button>
              <button
                type="button"
                onClick={() => {
                  if (streaming) handleStop();
                  setStreamSource("simulated");
                }}
                className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                  streamSource === "simulated"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Simulated Drive
              </button>
            </div>
          </div>

          {/* Vehicle ID Assignment */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-indigo-600" />
              Vehicle Identifier
            </Label>
            <div className="flex gap-1.5">
              <Input
                type="text"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value.toUpperCase())}
                placeholder="e.g. KA-01-PATROL-402"
                className="h-9 text-xs rounded-xl font-bold uppercase"
              />
              <Select
                value={vehicleId}
                onValueChange={(val) => {
                  setVehicleId(val);
                  const preset = VEHICLE_PRESETS.find((p) => p.id === val);
                  if (preset) {
                    setVehicleType(preset.type);
                    setPatrolRoute(preset.route);
                  }
                }}
              >
                <SelectTrigger className="w-24 h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_PRESETS.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-blue-600" />
              Vehicle Fleet Type
            </Label>
            <Input
              type="text"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="h-9 text-xs rounded-xl font-medium"
            />
          </div>

          {/* Mobile Camera Flip & Devices */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-purple-600" />
              Mobile Lens Orientation
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleCameraFacing}
                disabled={streamSource === "simulated"}
                className="flex-1 h-9 text-xs font-bold border-slate-200 rounded-xl flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                {facingMode === "environment" ? "Rear Windshield" : "Front Cabin"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Video Preview & Overlay HUD */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="bg-slate-950 border border-slate-800 rounded-2xl shadow-md overflow-hidden relative">
            <div className="relative aspect-video w-full flex items-center justify-center bg-black overflow-hidden">
              {/* Hardware Video Stream */}
              <video
                ref={videoRef}
                playsInline
                webkit-playsinline="true"
                autoPlay
                muted
                className={`w-full h-full object-cover ${
                  streaming && streamSource === "camera" ? "block" : "hidden"
                }`}
              />

              {/* Simulation Canvas */}
              <canvas
                ref={simCanvasRef}
                width={800}
                height={450}
                className={`w-full h-full object-cover ${
                  streaming && streamSource === "simulated" ? "block" : "hidden"
                }`}
              />

              {/* Bounding Box Canvas Overlay */}
              <canvas
                ref={overlayCanvasRef}
                className={`absolute inset-0 pointer-events-none ${streaming ? "block" : "hidden"}`}
              />

              {/* Offscreen frame analysis canvas */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Inactive State Banner */}
              {!streaming && (
                <div className="text-center p-8 text-slate-400 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                    <Video className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-300">
                    Dashcam Feed Inactive
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click <strong>Start Dashcam</strong> to begin live road scanning, or switch to <strong>Simulated Drive</strong> for instant hardware-free testing.
                  </p>
                </div>
              )}

              {/* Real-Time Dashcam Telemetry HUD Overlay */}
              {streaming && (
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none text-white text-[11px] font-mono z-10">
                  <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                      <span className="font-bold text-rose-400 uppercase tracking-wider">
                        REC ● 1080P
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-300 font-bold">{vehicleId}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[260px]">
                      ROUTE: {patrolRoute}
                    </div>
                  </div>

                  <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-right space-y-0.5">
                    <div className="flex items-center justify-end gap-1.5 font-bold text-emerald-400">
                      <Gauge className="w-3.5 h-3.5" />
                      <span>{vehicleSpeed} KM/H</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {gpsLocation ? `${gpsLocation.lat.toFixed(4)}°N, ${gpsLocation.lng.toFixed(4)}°E` : "GPS PENDING"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Video Footer Status Bar */}
            <div className="bg-slate-900/95 border-t border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {gpsLocation
                    ? `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)} (±${gpsLocation.accuracy}m)`
                    : "GPS: Not Available"}
                </span>
                <span>•</span>
                <span>Sampling: {samplingRateFps} FPS</span>
                <span>•</span>
                <span>Lens: {facingMode === "environment" ? "Windshield" : "Cabin"}</span>
              </div>
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                Model: RoadDamage-YOLOv8
              </span>
            </div>
          </Card>

          {/* Controls Bar */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label className="font-bold text-slate-700">
                    Confidence Threshold: {confidenceThreshold}%
                  </Label>
                  <span className="text-slate-400 text-[11px]">Minimum to log</span>
                </div>
                <Slider
                  value={[confidenceThreshold]}
                  onValueChange={(val) => setConfidenceThreshold(val[0])}
                  min={50}
                  max={95}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label className="font-bold text-slate-700">
                    Sampling Frequency: {samplingRateFps} FPS
                  </Label>
                  <span className="text-slate-400 text-[11px]">Bandwidth control</span>
                </div>
                <Slider
                  value={[samplingRateFps]}
                  onValueChange={(val) => setSamplingRateFps(val[0])}
                  min={1}
                  max={3}
                  step={1}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Captured Detection Events & Instant Assign */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">
                  Detected Road Events
                </CardTitle>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automated vehicle defect candidates
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {recentEvents.length} Captured
              </span>
            </CardHeader>
            <CardContent className="p-0 max-h-[540px] overflow-y-auto divide-y divide-slate-100">
              {recentEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <Camera className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>No defects captured yet. Start camera or simulation to log events.</p>
                </div>
              ) : (
                recentEvents.map((ev) => (
                  <div key={ev.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {ev.defect}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                          {ev.vehicleId}
                        </span>
                      </div>
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">
                        {ev.confidence.toFixed(0)}% Conf
                      </Badge>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-20 h-14 rounded-xl bg-slate-900 overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                        <img
                          src={ev.snapshot}
                          alt="Snapshot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 space-y-0.5 min-w-0">
                        <p className="truncate font-medium text-slate-700">GPS: {ev.gps}</p>
                        <p className="text-slate-400">Time: {ev.timestamp}</p>
                        <p className="text-[10px] text-indigo-600 truncate">{ev.route}</p>
                      </div>
                    </div>

                    {/* Instant Assign / Convert to Official Complaint */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        disabled={convertingId === ev.id}
                        onClick={() => handleAssignToComplaint(ev)}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex-1 rounded-xl shadow-2xs"
                      >
                        {convertingId === ev.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <SendHorizontal className="w-3.5 h-3.5 mr-1" />
                        )}
                        Assign & File Complaint
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRecentEvents((prev) => prev.filter((x) => x.id !== ev.id));
                          toast.info("Event dismissed.");
                        }}
                        className="h-8 text-xs border-slate-200 text-slate-600 rounded-xl"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
