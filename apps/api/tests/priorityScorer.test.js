import test from "node:test";
import assert from "node:assert/strict";
import { calculatePriorityScore } from "../src/services/priorityScorer.js";

test("calculatePriorityScore calculates correct base and category scores", () => {
  const potholeRes = calculatePriorityScore({
    category: "pothole",
    isUrgent: false,
    trafficDensity: "medium",
  });

  // Base 20 + pothole 28 = 48 -> medium
  assert.equal(potholeRes.score, 48);
  assert.equal(potholeRes.tier, "medium");
  assert.ok(potholeRes.explanations.length > 0);
});

test("calculatePriorityScore escalates urgent hazards and damaged manholes to critical", () => {
  const criticalRes = calculatePriorityScore({
    category: "manhole_damaged",
    isUrgent: true,
    trafficDensity: "high",
    nearbyReportCount: 3,
  });

  // Base 20 + manhole 35 + urgent 20 + cluster 12 + high traffic 10 = 97 -> critical
  assert.equal(criticalRes.score, 97);
  assert.equal(criticalRes.tier, "critical");
});

test("calculatePriorityScore clamps max score at 100", () => {
  const maxRes = calculatePriorityScore({
    category: "manhole_damaged",
    isUrgent: true,
    trafficDensity: "high",
    nearbyReportCount: 10,
    waitingHours: 200,
  });

  assert.equal(maxRes.score, 100);
  assert.equal(maxRes.tier, "critical");
});
