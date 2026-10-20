import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCreateComplaint } from "@/hooks/useComplaints";
import { supabase } from "@/integrations/supabase/client";
import { CIVIC_CATEGORIES, analyzeRoadImage } from "@/services/aiService";
import UploadDropzone from "@/components/common/UploadDropzone";
import AiDetectionCard from "@/components/AiDetectionCard";
import MapView from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin, Sparkles, Loader2, CheckCircle2, AlertCircle, Eye } from "lucide-react";

export default function ReportForm({ onSuccess }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createComplaint = useCreateComplaint();

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("pothole");
  const [priority, setPriority] = useState("high");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState(null); // [lat, lng]
  const [address, setAddress] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  // Image & AI state
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAiResultModal, setShowAiResultModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Reverse geocode when position is selected
  useEffect(() => {
    if (!position) return;
    const [lat, lng] = position;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
      { headers: { "Accept-Language": "en" } }
    )
      .then((res) => res.json())
      .then((geoData) => {
        const addr = geoData?.address;
        const parts = [
          addr?.road,
          addr?.suburb || addr?.neighbourhood,
          addr?.city || addr?.town || addr?.village,
          addr?.state,
        ].filter(Boolean);
        const resolved =
          parts.length > 0
            ? parts.join(", ")
            : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setAddress(resolved);
      })
      .catch(() => {
        setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      });
  }, [position]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser. Please select location on the map.");
      setShowMapPicker(true);
      return;
    }

    toast.info("Requesting current GPS location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        toast.success("Current location captured!");
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Please pick your spot on the map."
            : "Could not retrieve GPS coordinates. Please pick on the map.";
        toast.error(msg);
        setShowMapPicker(true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleImageSelected = (file) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAiResult(null); // Reset past AI analysis for new photo
  };

  const handleClearImage = () => {
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setAiResult(null);
  };

  const handleAnalyzeWithAi = async () => {
    if (!imageFile && !previewUrl) {
      toast.error("Please upload or capture a road photo first.");
      return;
    }

    setAnalyzingAi(true);
    try {
      const result = await analyzeRoadImage(imageFile || previewUrl);
      setAiResult(result);
      setShowAiResultModal(true);
      toast.success("AI detection completed successfully!");
    } catch (err) {
      toast.error(err.message || "AI detection service is currently unavailable.");
    } finally {
      setAnalyzingAi(false);
    }
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    if (aiResult.primaryDefect?.category) {
      setCategory(aiResult.primaryDefect.category);
    }
    if (aiResult.primaryDefect?.severity) {
      setPriority(aiResult.primaryDefect.severity.toLowerCase());
    }
    if (!title) {
      setTitle(`${aiResult.primaryDefect?.label || "Pothole"} reported via AI scan`);
    }
    if (!description) {
      setDescription(
        `AI detected ${aiResult.primaryDefect?.label} (${aiResult.primaryDefect?.confidence?.toFixed(
          1
        )}% confidence). ${aiResult.primaryDefect?.recommendation || ""}`
      );
    }
    setShowAiResultModal(false);
    toast.success("Applied AI detection attributes to the report!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to submit a complaint");
      navigate("/auth");
      return;
    }

    if (!position) {
      toast.error("Please provide or pick a location coordinates for the issue.");
      setShowMapPicker(true);
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = null;

      // 1. Upload photo to Supabase storage if file is attached
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("complaint-images")
          .upload(path, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type,
          });

        if (uploadError) {
          // If storage bucket isn't reachable or error, fallback to preview or mock reference
          console.warn("Storage upload warning:", uploadError.message);
          imageUrl = previewUrl || "/images/pothole-defect.jpg";
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("complaint-images").getPublicUrl(path);
          imageUrl = publicUrl;
        }
      } else if (previewUrl) {
        imageUrl = previewUrl;
      }

      // 2. Submit complaint record to PostgreSQL
      const record = {
        user_id: user.id,
        title: title || `${category.replace(/_/g, " ")} reported`,
        description: description || "Road issue identified by citizen.",
        image_url: imageUrl || "/images/pothole-defect.jpg",
        latitude: position[0],
        longitude: position[1],
        address: address || `${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
        priority: priority || "medium",
        is_urgent: isUrgent,
      };

      await createComplaint.mutateAsync(record);
      toast.success("Road issue submitted successfully! Complaint logged.");

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/my-complaints");
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* AI Result Card Banner if analysis is active */}
      {aiResult && showAiResultModal && (
        <div className="mb-6 animate-fade-in">
          <AiDetectionCard
            imageSrc={previewUrl || "/images/pothole-defect.jpg"}
            aiResult={aiResult}
            onUseResult={applyAiResult}
            onTryAnother={() => {
              setShowAiResultModal(false);
              handleClearImage();
            }}
          />
        </div>
      )}

      {/* Main 2-Column Layout Matching Reference Screen 3 */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Upload & AI Detection */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-slate-800">
                Road Evidence Photo
              </Label>
              {aiResult && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  AI Analyzed
                </span>
              )}
            </div>

            <UploadDropzone
              onImageSelected={handleImageSelected}
              previewUrl={previewUrl}
              onClear={handleClearImage}
              maxSizeMb={5}
            />

            {/* Detect with AI Button */}
            <div className="pt-2 flex items-center gap-3">
              <Button
                type="button"
                onClick={handleAnalyzeWithAi}
                disabled={!previewUrl || analyzingAi}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                {analyzingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Analyzing with AI Detector...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    Detect with AI
                  </>
                )}
              </Button>

              {aiResult && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAiResultModal(!showAiResultModal)}
                  className="h-11 px-3 border-slate-300 text-slate-700 rounded-xl"
                  title="View AI analysis"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Location, Category, Description, Submit */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
            {/* Location Section matching Screen 3 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Location
                </Label>
                <button
                  type="button"
                  onClick={handleLocateMe}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Use Current Location
                </button>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g. 12.9716, 77.5946 Bengaluru, Karnataka"
                  value={
                    address ||
                    (position ? `${position[0].toFixed(4)}, ${position[1].toFixed(4)}` : "")
                  }
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-11 text-sm rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className="h-11 border-slate-300 text-slate-700 rounded-xl shrink-0"
                >
                  {showMapPicker ? "Hide Map" : "Pick on Map"}
                </Button>
              </div>

              {showMapPicker && (
                <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden animate-fade-in">
                  <p className="text-[11px] text-slate-500 p-2 bg-slate-50 border-b border-slate-200">
                    Click anywhere on the map to set the exact issue coordinates.
                  </p>
                  <div className="h-[220px]">
                    <MapView
                      complaints={[]}
                      onMapClick={(lat, lng) => {
                        setPosition([lat, lng]);
                        toast.success(`Coordinates set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                      }}
                      selectedPosition={position}
                      zoom={position ? 15 : 12}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Issue Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:ring-emerald-500">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {CIVIC_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label} ({cat.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Issue Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Title / Short Summary
              </Label>
              <Input
                type="text"
                required
                placeholder="e.g. Hazardous pothole on main road lane"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 text-sm rounded-xl border-slate-200 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Description Textarea matching Screen 3 */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Description
              </Label>
              <Textarea
                rows={3}
                required
                placeholder="Large pothole on the main road causing traffic issues."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm rounded-xl border-slate-200 focus-visible:ring-emerald-500 resize-none"
              />
            </div>

            {/* Priority and Urgent Flag */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Priority
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="critical">Critical (Immediate Hazard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  Mark as Urgent Hazard
                </label>
              </div>
            </div>

            {/* Submit Button matching Screen 3 */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm text-base mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Logging Complaint...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
