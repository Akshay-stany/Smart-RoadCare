import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

const IngestEventSchema = z.object({
  sourceType: z.enum(["browser_camera", "dashcam_agent", "upload"]).default("browser_camera"),
  vehicleId: z.string().optional(),
  cameraId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  detectedClass: z.string(),
  confidence: z.number().min(0).max(100),
  boundingBox: z.any().optional(),
  snapshotUrl: z.string().optional(),
});

// List camera detection events
router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("detection_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ success: true, count: data?.length || 0, data: data || [] });
  } catch (err) {
    next(err);
  }
});

// Ingest detection event from camera or vehicle edge agent
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const validated = IngestEventSchema.parse(req.body);
    const eventCode = `EV-${Date.now().toString().slice(-6)}`;

    const { data: event, error } = await supabaseAdmin
      .from("detection_events")
      .insert({
        event_code: eventCode,
        source_type: validated.sourceType,
        vehicle_id: validated.vehicleId || null,
        camera_id: validated.cameraId || null,
        latitude: validated.latitude || null,
        longitude: validated.longitude || null,
        detected_class: validated.detectedClass,
        confidence: validated.confidence,
        bounding_box: validated.boundingBox || null,
        snapshot_url: validated.snapshotUrl || null,
        review_state: "new",
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: event });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors });
    }
    next(err);
  }
});

export default router;
