import test from "node:test";
import assert from "node:assert/strict";
import { findDuplicateCandidates } from "../src/services/duplicateDetector.js";

test("findDuplicateCandidates identifies nearby reports within radius", () => {
  const target = {
    id: "target-1",
    latitude: 12.9716,
    longitude: 77.5946,
    category: "pothole",
    created_at: new Date().toISOString(),
  };

  const existing = [
    {
      id: "dup-1",
      complaint_id: "RC-1001",
      title: "Pothole nearby",
      category: "pothole",
      latitude: 12.9717, // ~15 meters away
      longitude: 77.5947,
      status: "pending",
      created_at: new Date().toISOString(),
    },
    {
      id: "far-1",
      complaint_id: "RC-1002",
      title: "Pothole far away",
      category: "pothole",
      latitude: 13.05, // ~9 km away
      longitude: 77.62,
      status: "pending",
      created_at: new Date().toISOString(),
    },
  ];

  const candidates = findDuplicateCandidates(target, existing, 75);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].id, "dup-1");
  assert.ok(candidates[0].distanceMeters < 50);
  assert.equal(candidates[0].categoryMatch, true);
});

test("findDuplicateCandidates ignores reports outside time window", () => {
  const target = {
    id: "target-1",
    latitude: 12.9716,
    longitude: 77.5946,
    category: "pothole",
    created_at: new Date().toISOString(),
  };

  const existingOld = [
    {
      id: "old-1",
      complaint_id: "RC-0900",
      title: "Old pothole 2 months ago",
      category: "pothole",
      latitude: 12.97165,
      longitude: 77.59465,
      status: "resolved",
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    },
  ];

  const candidates = findDuplicateCandidates(target, existingOld, 75, 14);
  assert.equal(candidates.length, 0);
});
