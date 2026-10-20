/**
 * Deterministic Explainable Priority Scorer
 * Calculates a transparent score from 0 to 100 based on civic risk factors.
 */

export function calculatePriorityScore({
  category = "pothole",
  isUrgent = false,
  confidence = 80,
  waitingHours = 0,
  nearbyReportCount = 1,
  trafficDensity = "medium", // "low", "medium", "high"
}) {
  let score = 20; // Base score
  const explanations = [];

  // 1. Defect Category weighting (up to +35 pts)
  const categoryWeights = {
    manhole_damaged: 35, // Fatal hazard to vehicles & pedestrians
    pothole: 28,
    guardrail_damaged: 25,
    water_leakage: 22,
    road_crack: 18,
    broken_surface: 15,
    streetlight_damaged: 14,
    road_sign_damaged: 12,
    road_marking_faded: 8,
    broken_footpath: 10,
    other: 10,
  };

  const catWeight = categoryWeights[category] || 15;
  score += catWeight;
  explanations.push(`Category hazard rating: +${catWeight} (${category.replace(/_/g, " ")})`);

  // 2. Citizen Urgent Flag (+20 pts)
  if (isUrgent) {
    score += 20;
    explanations.push("Marked as urgent safety hazard: +20");
  }

  // 3. Repeated Independent Reports cluster factor (+5 pts per extra report, up to +20 pts)
  if (nearbyReportCount > 1) {
    const clusterPts = Math.min((nearbyReportCount - 1) * 6, 20);
    score += clusterPts;
    explanations.push(`Cluster frequency: +${clusterPts} (${nearbyReportCount} independent reports in proximity)`);
  }

  // 4. Overdue SLA / Waiting Time (+1 pt per 12 hours waiting, up to +15 pts)
  if (waitingHours > 24) {
    const waitPts = Math.min(Math.floor((waitingHours - 24) / 12), 15);
    if (waitPts > 0) {
      score += waitPts;
      explanations.push(`Aging SLA factor: +${waitPts} (${Math.round(waitingHours)}h unresolved)`);
    }
  }

  // 5. Traffic density / Road importance (+10 pts for high traffic arterial roads)
  if (trafficDensity === "high") {
    score += 10;
    explanations.push("High-density arterial road: +10");
  }

  // Clamp score between 0 and 100
  const finalScore = Math.min(Math.max(score, 0), 100);

  // Map to priority tier
  let priorityTier = "low";
  if (finalScore >= 80) priorityTier = "critical";
  else if (finalScore >= 60) priorityTier = "high";
  else if (finalScore >= 40) priorityTier = "medium";

  return {
    score: finalScore,
    tier: priorityTier,
    explanations,
    calculatedAt: new Date().toISOString(),
  };
}
