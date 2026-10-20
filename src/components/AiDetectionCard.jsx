import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, RotateCcw, AlertTriangle, Cpu } from "lucide-react";

export default function AiDetectionCard({
  imageSrc,
  aiResult,
  onUseResult,
  onTryAnother,
  className = "",
}) {
  if (!aiResult) return null;

  const { primaryDefect, detectedObjects, modelName, inferenceTimeMs } = aiResult;
  const bbox = primaryDefect?.boundingBox || { x: 0.25, y: 0.4, width: 0.5, height: 0.4 };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              AI Detection Result
            </h2>
            <p className="text-xs text-slate-400">
              Model: {modelName || "YOLOv8-RDD"} • Inference: {inferenceTimeMs || 85}ms
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
          Analysis Complete
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Annotated Image with Bounding Box matching Screen 4 */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-[4/3] flex items-center justify-center">
            <img
              src={imageSrc}
              alt="Analyzed Road Defect"
              className="w-full h-full object-cover"
            />

            {/* Bounding Box Overlay */}
            <div
              className="absolute border-2 border-rose-500 bg-rose-500/15 pointer-events-none transition-all"
              style={{
                left: `${bbox.x * 100}%`,
                top: `${bbox.y * 100}%`,
                width: `${bbox.width * 100}%`,
                height: `${bbox.height * 100}%`,
              }}
            >
              <div className="absolute -top-6 left-0 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-xs flex items-center gap-1 shadow-xs">
                <span>{primaryDefect?.label || "Pothole"}</span>
                <span>{primaryDefect?.confidence?.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Original Image thumbnail underneath */}
          <div className="flex items-center gap-3 pt-1">
            <div className="w-16 h-12 rounded-lg border-2 border-emerald-500 overflow-hidden shrink-0 shadow-2xs">
              <img
                src={imageSrc}
                alt="Original"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs font-semibold text-slate-600">
              Original Image Preview
            </span>
          </div>
        </div>

        {/* Right Side: Detected Issues & Objects matching Screen 4 */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Detected Issue */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Primary Defect
              </span>
              <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold text-xs hover:bg-rose-100">
                {primaryDefect?.severity || "High"} Severity
              </Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-extrabold text-slate-900">
                {primaryDefect?.label || "Pothole"}
              </h3>
              <span className="text-base font-bold text-emerald-600">
                {primaryDefect?.confidence?.toFixed(1)}% Confidence
              </span>
            </div>
          </div>

          {/* Detected Objects Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Detected Objects
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {(detectedObjects || []).map((obj, i) => (
                <div key={i} className="flex items-center justify-between px-3.5 py-2.5 bg-white text-xs">
                  <span className="font-medium text-slate-700">{obj.name}</span>
                  <span className="font-semibold text-slate-900">{obj.confidence.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info recommendation box */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {primaryDefect?.recommendation ||
                "This image shows a significant road defect. It is recommended to mark as High Priority."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              onClick={onUseResult}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-sm"
            >
              <Check className="w-4 h-4 mr-2" />
              Use This Result
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onTryAnother}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium h-11 rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Another Image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
