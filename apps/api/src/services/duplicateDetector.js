/**
 * Duplicate & Nearby Candidate Issue Detector
 * Detects potential duplicate reports using haversine geographic distance,
 * category alignment, and temporal windows without auto-deleting records.
 */

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // Distance in meters
}

export function findDuplicateCandidates(
  targetReport,
  existingReports = [],
  radiusMeters = 75,
  windowDays = 14
) {
  const { latitude, longitude, category, created_at, id } = targetReport;
  if (!latitude || !longitude) return [];

  const targetDate = created_at ? new Date(created_at) : new Date();
  const maxTimeDiffMs = windowDays * 24 * 60 * 60 * 1000;

  const candidates = [];

  for (const item of existingReports) {
    if (item.id === id) continue; // Skip self

    if (!item.latitude || !item.longitude) continue;

    const distance = calculateHaversineDistance(
      latitude,
      longitude,
      item.latitude,
      item.longitude
    );

    if (distance <= radiusMeters) {
      const itemDate = new Date(item.created_at || targetDate);
      const timeDiffMs = Math.abs(targetDate.getTime() - itemDate.getTime());

      if (timeDiffMs <= maxTimeDiffMs) {
        const categoryMatch =
          category && item.category && category.toLowerCase() === item.category.toLowerCase();

        // Calculate similarity confidence %
        let matchScore = 0;
        if (distance < 20) matchScore += 50;
        else if (distance < 50) matchScore += 35;
        else matchScore += 20;

        if (categoryMatch) matchScore += 35;
        if (timeDiffMs < 3 * 24 * 60 * 60 * 1000) matchScore += 15;

        candidates.push({
          complaintId: item.complaint_id || item.id,
          id: item.id,
          title: item.title,
          category: item.category,
          status: item.status,
          distanceMeters: distance,
          daysDifference: Math.round(timeDiffMs / (24 * 60 * 60 * 1000)),
          categoryMatch: Boolean(categoryMatch),
          confidencePercent: Math.min(matchScore, 98),
          existingComplaintUrl: `/complaints/${item.id}`,
        });
      }
    }
  }

  // Sort by highest confidence and closest distance
  return candidates.sort((a, b) => b.confidencePercent - a.confidencePercent);
}
