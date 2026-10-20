import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateComplaint, suggestPriority } from "@/hooks/useComplaints";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { Upload, MapPin, Loader2, AlertTriangle, X } from "lucide-react";
import MapView from "./MapView";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const BANGALORE_COORDS = [12.9716, 77.5946];
async function compressImage(file) {
    if (!file.type.startsWith("image/"))
        return file;
    const bitmap = await createImageBitmap(file);
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context)
        return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    let quality = 0.82;
    let blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality));
    while (blob && blob.size > MAX_IMAGE_BYTES && quality > 0.55 && outputType === "image/jpeg") {
        quality -= 0.08;
        blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality));
    }
    if (!blob)
        return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, outputType === "image/png" ? ".png" : ".jpg"), {
        type: outputType,
        lastModified: Date.now(),
    });
}
export default function ReportForm({ onSuccess }) {
    const { user } = useAuth();
    const createComplaint = useCreateComplaint();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [position, setPosition] = useState(null);
    const [isUrgent, setIsUrgent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isPreparingImage, setIsPreparingImage] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileRef = useRef(null);
    const previousPreviewRef = useRef(null);
    const setPreviewUrl = (url) => {
        if (previousPreviewRef.current) {
            URL.revokeObjectURL(previousPreviewRef.current);
        }
        previousPreviewRef.current = url;
        setImagePreview(url);
    };
    useEffect(() => {
        return () => {
            if (previousPreviewRef.current) {
                URL.revokeObjectURL(previousPreviewRef.current);
            }
        };
    }, []);
    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file.");
            return;
        }
        setPreviewUrl(URL.createObjectURL(file));
        setImageFile(file);
        setIsPreparingImage(true);
        try {
            const compressed = await compressImage(file);
            if (compressed.size > MAX_IMAGE_BYTES) {
                setImageFile(null);
                setPreviewUrl(null);
                toast.error("Image must be less than 2 MB after compression.");
                return;
            }
            setImageFile(compressed);
            if (compressed !== file) {
                setPreviewUrl(URL.createObjectURL(compressed));
            }
        }
        catch {
            setImageFile(null);
            setPreviewUrl(null);
            toast.error("Unable to process image. Please try another file.");
        }
        finally {
            setIsPreparingImage(false);
            if (fileRef.current)
                fileRef.current.value = "";
        }
    };
    const handleLocate = () => {
        if (!navigator.geolocation) {
            toast.error("Location is not supported by this browser. Click the map to choose the spot manually.");
            return;
        }
        navigator.geolocation.getCurrentPosition((pos) => setPosition([pos.coords.latitude, pos.coords.longitude]), (err) => {
            // Never invent coordinates: leave the position unset so the user must pick one.
            const msg = err.code === err.PERMISSION_DENIED
                ? "Location permission was denied. Click the map to choose the spot manually."
                : "Could not detect your location. Click the map to choose the spot manually.";
            toast.error(msg);
        }, { enableHighAccuracy: false, timeout: 4500, maximumAge: 60_000 });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error("Please sign in");
            return;
        }
        if (!position) {
            toast.error("Please select a location on the map");
            return;
        }
        setLoading(true);
        try {
            let imageUrl;
            if (imageFile) {
                if (imageFile.size > MAX_IMAGE_BYTES) {
                    throw new Error("Image must be less than 2 MB.");
                }
                setIsUploadingImage(true);
                try {
                    const ext = imageFile.name.split(".").pop() || "jpg";
                    const path = `${user.id}/${Date.now()}.${ext}`;
                    const { error: uploadError } = await supabase.storage
                        .from("complaint-images")
                        .upload(path, imageFile, { cacheControl: "3600", upsert: false, contentType: imageFile.type });
                    if (uploadError)
                        throw uploadError;
                    const { data: { publicUrl } } = supabase.storage.from("complaint-images").getPublicUrl(path);
                    imageUrl = publicUrl;
                }
                catch (uploadError) {
                    throw new Error(getErrorMessage(uploadError, "Image upload failed."));
                }
                finally {
                    setIsUploadingImage(false);
                }
            }
            const priority = suggestPriority(title, description);
            // Reverse geocode to get place name
            let address;
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[0]}&lon=${position[1]}&zoom=18&addressdetails=1&accept-language=en`, { headers: { "Accept-Language": "en" } });
                const geoData = await geoRes.json();
                const addr = geoData?.address;
                const parts = [addr?.road, addr?.suburb || addr?.neighbourhood, addr?.city || addr?.town || addr?.village, addr?.state, addr?.country].filter(Boolean);
                address = [...new Set(parts)].slice(0, 4).join(", ") || geoData?.display_name?.split(",").slice(0, 3).join(",").trim();
            }
            catch {
                address = undefined; // address is optional; coordinates are still saved
            }
            await createComplaint.mutateAsync({
                user_id: user.id,
                title,
                description,
                image_url: imageUrl,
                latitude: position[0],
                longitude: position[1],
                address,
                priority,
                is_urgent: isUrgent,
            });
            toast.success("Issue reported successfully!");
            setTitle("");
            setDescription("");
            setImageFile(null);
            setPreviewUrl(null);
            setPosition(null);
            setIsUrgent(false);
            onSuccess?.();
        }
        catch (err) {
            toast.error(getErrorMessage(err, "Failed to submit report"));
        }
        finally {
            setIsUploadingImage(false);
            setLoading(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Issue Title</Label>
        <Input id="title" placeholder='e.g., "Pothole on main road"' value={title} onChange={(e) => setTitle(e.target.value)} required/>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe the issue in detail..." value={description} onChange={(e) => setDescription(e.target.value)} required rows={3}/>
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Photo Evidence</Label>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
        {imagePreview ? (<div className="relative">
            <img src={imagePreview} alt="Preview" className="h-40 w-full rounded-lg object-cover border"/>
            <button type="button" onClick={() => { setImageFile(null); setPreviewUrl(null); }} className="absolute top-2 right-2 rounded-full bg-card p-1 shadow-md">
              <X className="h-4 w-4"/>
            </button>
          </div>) : (<button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            <Upload className="h-5 w-5"/>
            <span className="text-sm">Click to upload image</span>
          </button>)}
        {isPreparingImage && <p className="text-xs text-muted-foreground">Optimizing image...</p>}
        {imageFile && <p className="text-xs text-muted-foreground">Image size: {(imageFile.size / (1024 * 1024)).toFixed(2)} MB</p>}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Location</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleLocate}>
            <MapPin className="mr-1 h-3 w-3"/>Use My Location
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Click on the map to select location</p>
        <MapView complaints={[]} onMapClick={(lat, lng) => setPosition([lat, lng])} selectedPosition={position} className="h-[250px] w-full rounded-xl border" zoom={4}/>
        {position && (<p className="text-xs text-muted-foreground">
            Selected: {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </p>)}
      </div>

      {/* Urgent toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="rounded border-input"/>
        <AlertTriangle className="h-4 w-4 text-status-pending"/>
        <span className="text-sm text-card-foreground">Mark as urgent</span>
      </label>

      <Button type="submit" className="w-full" disabled={loading || isPreparingImage || isUploadingImage}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
        {isUploadingImage ? "Uploading image..." : "Submit Report"}
      </Button>
    </form>);
}
