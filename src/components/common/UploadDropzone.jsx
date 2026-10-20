import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UploadDropzone({
  onImageSelected,
  previewUrl,
  onClear,
  maxSizeMb = 5,
  className = "",
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    setError(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, or WebP).");
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Image size exceeds the ${maxSizeMb}MB limit.`);
      return;
    }

    onImageSelected(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
          <img
            src={previewUrl}
            alt="Upload preview"
            className="w-full h-64 object-cover object-center rounded-xl"
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/90 text-slate-800 hover:bg-white text-xs font-medium"
            >
              Change Photo
            </Button>
            {onClear && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onClear}
                className="text-xs font-medium"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center bg-slate-50/70 hover:bg-slate-50 ${
            isDragging
              ? "border-emerald-500 bg-emerald-50/30 scale-[0.99]"
              : "border-slate-300 hover:border-slate-400"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-emerald-600 mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Upload Image <span className="font-normal text-slate-500">or drag and drop</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            JPG, PNG, WebP (Max {maxSizeMb}MB)
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-2xs">
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            Browse Files
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
