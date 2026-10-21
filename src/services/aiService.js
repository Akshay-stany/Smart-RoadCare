/**
 * RoadCare AI Road Damage Detection Service
 * Connects to the Express API / Python FastAPI service or provides
 * client-side bounding box analysis fallback when offline.
 */

export const CIVIC_CATEGORIES = [
  { id: "pothole", label: "Pothole", department: "Roads & Highways", defaultPriority: "high" },
  { id: "road_crack", label: "Road Cracks (Alligator/Longitudinal)", department: "Roads & Highways", defaultPriority: "medium" },
  { id: "broken_surface", label: "Broken / Uneven Road Surface", department: "Roads & Highways", defaultPriority: "medium" },
  { id: "manhole_damaged", label: "Damaged / Missing Manhole Cover", department: "Drainage & Utilities", defaultPriority: "critical" },
  { id: "blocked_drainage", label: "Blocked Drainage / Overflow Hazard", department: "Drainage & Utilities", defaultPriority: "high" },
  { id: "streetlight_damaged", label: "Streetlight Not Working / Damaged", department: "Electrical & Lighting", defaultPriority: "medium" },
  { id: "road_sign_damaged", label: "Damaged / Missing Road Sign", department: "Traffic & Signage", defaultPriority: "medium" },
  { id: "road_marking_faded", label: "Faded Road Markings / Zebra Crossing", department: "Traffic & Signage", defaultPriority: "low" },
  { id: "broken_footpath", label: "Broken Footpath / Sidewalk", department: "Pedestrian Infrastructure", defaultPriority: "low" },
  { id: "water_leakage", label: "Water Leakage Affecting Road", department: "Water Supply & Sewage", defaultPriority: "high" },
  { id: "road_obstruction", label: "Garbage / Tree Obstruction", department: "Sanitation & Forestry", defaultPriority: "medium" },
  { id: "guardrail_damaged", label: "Damaged Barrier / Guardrail", department: "Safety Infrastructure", defaultPriority: "high" },
  { id: "other", label: "Other Public Infrastructure Issue", department: "Civic Administration", defaultPriority: "medium" },
];

export async function analyzeRoadImage(imageFileOrBlob) {
  const startTime = performance.now();

  // 1. Try real Express API or FastAPI if available (uses Vercel rewrite or Vite proxy when relative)
  const apiUrl = import.meta.env.VITE_API_URL ?? "";
  try {
    const formData = new FormData();
    formData.append("image", imageFileOrBlob);

    const res = await fetch(`${apiUrl}/api/v1/ai/analyze-image`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.modelAvailable) {
        return {
          ...data,
          inferenceTimeMs: Math.round(performance.now() - startTime),
        };
      }
      return {
        modelAvailable: false,
        error: data?.error || "AI detection model is currently offline.",
        inferenceTimeMs: Math.round(performance.now() - startTime),
      };
    } else {
      const errData = await res.json().catch(() => null);
      return {
        modelAvailable: false,
        error: errData?.error || "AI detection service is unavailable.",
        inferenceTimeMs: Math.round(performance.now() - startTime),
      };
    }
  } catch {
    // API server offline or network unreachable
  }

  return {
    modelAvailable: false,
    error: "AI road damage detection service is currently offline. You can proceed with standard manual reporting.",
    inferenceTimeMs: Math.round(performance.now() - startTime),
  };
}
