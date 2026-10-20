import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";

export default function LiveDetectionPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  // Camera & Stream State
  const [streaming, setStreaming] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [hasPermission, setHasPermission] = useState(null);

  // Detection Settings & Cooldown
  const [samplingRateFps, setSamplingRateFps] = useState(1); // 1 frame per second
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [activeDetections, setActiveDetections] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);

  // Detect available video devices
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((allDevices) => {
          const videoDevs = allDevices.filter((d) => d.kind === "videoinput");
          setDevices(videoDevs);
          if (videoDevs.length > 0) {
            setSelectedDeviceId(videoDevs[0].deviceId);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Request GPS on mount if permitted
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => {
          // Fallback or denied
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  // Start Camera
  const startCamera = async () => {
    try {
      const constraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: 1280, height: 720 }
          : { facingMode: "environment", width: 1280, height: 720 },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreaming(true);
      setHasPermission(true);
      toast.success("Camera feed started. Sampling road frames...");
    } catch (err) {
      setHasPermission(false);
      toast.error(
        err.name === "NotAllowedError"
          ? "Camera permission denied by browser. Please allow camera access in address bar."
          : `Failed to access camera: ${err.message}`
      );
    }
  };

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
    setActiveDetections([]);
    // Clear overlay canvas
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Frame sampling and AI analysis loop
  useEffect(() => {
    if (!streaming) return;

    const intervalMs = Math.round(1000 / samplingRateFps);
    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const overlay = overlayCanvasRef.current;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas frame to blob
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
            // 4-second cooldown to prevent repeated duplicate spamming of the exact same event
            if (now - lastDetectionTime > 4000) {
              setLastDetectionTime(now);

              const eventItem = {
                id: `EV-${Date.now().toString().slice(-6)}`,
                timestamp: new Date().toLocaleTimeString(),
                defect: result.primaryDefect.label,
                confidence: result.primaryDefect.confidence,
                severity: result.primaryDefect.severity,
                gps: gpsLocation ? `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}` : "Unavailable",
                snapshot: canvas.toDataURL("image/jpeg", 0.7),
              };

              setActiveDetections([result.primaryDefect]);
              setRecentEvents((prev) => [eventItem, ...prev.slice(0, 7)]);

              // Draw on overlay canvas
              if (overlay) {
                overlay.width = video.clientWidth;
                overlay.height = video.clientHeight;
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
                oCtx.fillRect(bx, by - 24, 130, 24);
                oCtx.fillStyle = "#FFFFFF";
                oCtx.font = "bold 12px sans-serif";
                oCtx.fillText(
                  `${result.primaryDefect.label} ${result.primaryDefect.confidence.toFixed(0)}%`,
                  bx + 6,
                  by - 7
                );
              }
            }
          }
        } catch {
          // Ignore sampling drop
        }
      }, "image/jpeg", 0.65);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [streaming, samplingRateFps, confidenceThreshold, gpsLocation, lastDetectionTime]);

  return (
    <AppShell>
      <PageHeader
        title="Live Camera & Dashcam Detection"
        description="Stream camera frames for real-time pothole and road damage inference with GPS geotagging."
        badge={
          <Badge
            variant="outline"
            className={
              streaming
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse font-bold"
                : "bg-slate-100 text-slate-600 font-medium"
            }
          >
            {streaming ? "● LIVE INFERENCE" : "IDLE"}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-3">
            {streaming ? (
              <Button
                onClick={stopCamera}
                variant="destructive"
                className="h-10 px-5 rounded-xl font-bold shadow-sm"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Camera
              </Button>
            ) : (
              <Button
                onClick={startCamera}
                className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            )}
          </div>
        }
      />

      {/* Safety Notice matching requirement */}
      <div className="p-3.5 mb-6 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Driver Safety Notice:</strong> When mounted in a vehicle, always keep this screen hands-free. Never interact with the device while operating a vehicle. Review and confirm detected draft events only when safely parked.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Video Preview & Overlay */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="bg-slate-950 border border-slate-800 rounded-2xl shadow-md overflow-hidden relative">
            <div className="relative aspect-video w-full flex items-center justify-center bg-black">
              {/* Actual Video Tag */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-contain ${streaming ? "block" : "hidden"}`}
              />

              {/* Bounding Box Canvas Overlay */}
              <canvas
                ref={overlayCanvasRef}
                className={`absolute inset-0 pointer-events-none ${streaming ? "block" : "hidden"}`}
              />

              {/* Offscreen sampling canvas */}
              <canvas ref={canvasRef} className="hidden" />

              {!streaming && (
                <div className="text-center p-8 text-slate-400 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                    <Video className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-300">
                    Camera Feed Inactive
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "Start Camera" above to begin road surface inspection. Sampling runs at 1 frame per second.
                  </p>
                </div>
              )}
            </div>

            {/* Video Footer Status Bar */}
            <div className="bg-slate-900/90 border-t border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {gpsLocation
                    ? `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)} (±${Math.round(
                        gpsLocation.accuracy
                      )}m)`
                    : "GPS: Not Available"}
                </span>
                <span>•</span>
                <span>Sampling: {samplingRateFps} FPS</span>
              </div>
              <span className="text-slate-300 font-semibold">
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

        {/* Right: Captured Detection Events */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">
                  Detected Road Events
                </CardTitle>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Throttled candidate incidents
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {recentEvents.length} Captured
              </span>
            </CardHeader>
            <CardContent className="p-0 max-h-[520px] overflow-y-auto divide-y divide-slate-100">
              {recentEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No events detected yet. Point camera at road defects to log candidate events.
                </div>
              ) : (
                recentEvents.map((ev) => (
                  <div key={ev.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {ev.defect}
                      </span>
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">
                        {ev.confidence.toFixed(0)}% Conf
                      </Badge>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-16 h-12 rounded-lg bg-slate-900 overflow-hidden border border-slate-200 shrink-0">
                        <img
                          src={ev.snapshot}
                          alt="Snapshot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 space-y-1 min-w-0">
                        <p className="truncate">GPS: {ev.gps}</p>
                        <p className="text-slate-400">Time: {ev.timestamp}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          toast.success(`Event ${ev.id} saved as draft!`);
                          navigate("/report");
                        }}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex-1 rounded-lg"
                      >
                        Convert to Report
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRecentEvents((prev) => prev.filter((x) => x.id !== ev.id));
                          toast.info("Event dismissed.");
                        }}
                        className="h-7 text-xs border-slate-200 text-slate-600 rounded-lg"
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
