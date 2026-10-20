import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCreateComplaint } from "@/hooks/useComplaints";
import { supabase } from "@/integrations/supabase/client";
import { CIVIC_CATEGORIES, analyzeRoadImage } from "@/services/aiService";
import {
  DEFAULT_CIVIC_CENTER,
  DEFAULT_CIVIC_ADDRESS,
  fetchCurrentPosition,
  reverseGeocode,
  searchLocation,
} from "@/hooks/useGeolocation";
import UploadDropzone from "@/components/common/UploadDropzone";
import AiDetectionCard from "@/components/AiDetectionCard";
import MapView from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin, Sparkles, Loader2, Search, CheckCircle2, Navigation2 } from "lucide-react";

export default function ReportForm({ onSuccess }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createComplaint = useCreateComplaint();

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("pothole");
  const [priority, setPriority] = useState("high");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState(DEFAULT_CIVIC_CENTER);
  const [address, setAddress] = useState(DEFAULT_CIVIC_ADDRESS);
  const [isUrgent, setIsUrgent] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);

  // Image & AI state
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAiResultModal, setShowAiResultModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-detect GPS position on mount
  useEffect(() => {
    fetchCurrentPosition()
      .then((pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        return reverseGeocode(coords[0], coords[1]);
      })
      .then((resolvedAddr) => {
        if (resolvedAddr) setAddress(resolvedAddr);
      })
      .catch(() => {
        // Keep default Bangalore coordinates
      });
  }, []);

  const handleLocateMe = async () => {
    setLocating(true);
    toast.info("Acquiring GPS location...");
    try {
      const pos = await fetchCurrentPosition();
      const coords = [pos.coords.latitude, pos.coords.longitude];
      setPosition(coords);
      const resolved = await reverseGeocode(coords[0], coords[1]);
      setAddress(resolved);
      toast.success(
        pos.source === "gps_high_accuracy"
          ? "Exact GPS location acquired!"
          : "Location centered on your area."
      );
    } catch {
      toast.error("Could not determine GPS. You can drag the pin on the map.");
    } finally {
      setLocating(false);
    }
  };

  const handleSearchLocation = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const result = await searchLocation(searchQuery);
      if (result) {
        const coords = [result.lat, result.lng];
        setPosition(coords);
        setAddress(result.displayName.split(",").slice(0, 3).join(","));
        toast.success(`Moved map to: ${searchQuery}`);
      } else {
        toast.error(`Could not locate "${searchQuery}". Please click on the map directly.`);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleMapClick = async (lat, lng) => {
    const coords = [lat, lng];
    setPosition(coords);
    const resolved = await reverseGeocode(lat, lng);
    setAddress(resolved);
    toast.info(`Pin moved: ${resolved}`);
  };

  const handleImageSelected = (file) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAiResult(null);
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

    setSubmitting(true);
    try {
      let imageUrl = null;

      // 1. Upload photo to Supabase storage if file is attached
      if (imageFile) {
        try {
          const ext = imageFile.name.split(".").pop() || "jpg";
          const path = `${user.id}/${Date.now()}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("complaint-images")
            .upload(path, imageFile, {
              cacheControl: "3600",
              upsert: false,
              contentType: imageFile.type,
            });

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("complaint-images").getPublicUrl(path);
            imageUrl = publicUrl;
          }
        } catch {
          // Cloud storage unreachable; retain preview
        }
      }

      if (!imageUrl) {
        imageUrl = previewUrl || "/images/pothole-defect.jpg";
      }

      // 2. Submit complaint record to reactive store
      const record = {
        user_id: user.id,
        title: title || `${category.replace(/_/g, " ")} reported`,
        description: description || "Road infrastructure issue reported by citizen.",
        image_url: imageUrl,
        latitude: position[0],
        longitude: position[1],
        address: address || `${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
        priority: priority || "high",
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
        {/* Left Column: Photo Upload & AI Detection */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Issue Photo Evidence
            </Label>

            <UploadDropzone
              onImageSelected={handleImageSelected}
              previewUrl={previewUrl}
              onClear={handleClearImage}
            />

            {/* Detect with AI CTA Button matching Screen 3 */}
            <Button
              type="button"
              onClick={handleAnalyzeWithAi}
              disabled={analyzingAi || (!imageFile && !previewUrl)}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {analyzingAi ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Road Surface...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Detect with AI
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column: Location Geomap & Issue Metadata matching Screen 3 */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
            {/* Interactive Mobile Geomap Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Geomap Location Pin
                </Label>
                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={locating}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {locating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : (
                    <Navigation2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  Use Current Location
                </button>
              </div>

              {/* Search Location Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="text"
                    placeholder="Search street, area or landmark..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchLocation();
                      }
                    }}
                    className="pl-9 h-10 text-xs rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchLocation}
                  disabled={searching || !searchQuery.trim()}
                  className="h-10 text-xs px-3 border-slate-200 rounded-xl"
                >
                  {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Locate"}
                </Button>
              </div>

              {/* Embedded Mobile Geomap Container */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs relative">
                <div className="h-[210px] w-full">
                  <MapView
                    complaints={[]}
                    center={position}
                    selectedPosition={position}
                    onMapClick={handleMapClick}
                    zoom={15}
                  />
                </div>
                {/* Visual Drag Instruction Overlay */}
                <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-xs p-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between pointer-events-none">
                  <span className="truncate font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {address || `${position[0].toFixed(4)}, ${position[1].toFixed(4)}`}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold shrink-0 ml-2">
                    Tap to move pin
                  </span>
                </div>
              </div>

              {/* Active Coordinates Display matching Screen 3 */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700 font-mono font-medium">
                    {position[0].toFixed(4)}, {position[1].toFixed(4)}
                  </span>
                </div>
                <span className="text-slate-500 truncate max-w-[200px] text-right font-medium">
                  {address}
                </span>
              </div>
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
                placeholder="Large pothole on the main road causing traffic issues..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm rounded-xl border-slate-200 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Urgent Safety Hazard Toggle */}
            <div className="flex items-center gap-2 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
              <input
                type="checkbox"
                id="urgent-toggle"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <label htmlFor="urgent-toggle" className="text-xs font-medium text-amber-900 cursor-pointer">
                Mark as high-risk / immediate road hazard (priority escalation)
              </label>
            </div>

            {/* Submit CTA Button matching Screen 3 */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  Logging Civic Issue...
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
