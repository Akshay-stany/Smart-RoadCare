import { createClient } from "@supabase/supabase-js";
import { config } from "./env.js";

const key = config.supabaseServiceRoleKey || config.supabaseAnonKey || "placeholder-key";

// Real Supabase Client
const realClient = createClient(config.supabaseUrl, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const isPlaceholder =
  !config.supabaseUrl ||
  config.supabaseUrl.includes("placeholder") ||
  config.supabaseUrl.includes("YOUR-PROJECT") ||
  config.supabaseUrl.includes("YOUR_PROJECT") ||
  !config.supabaseServiceRoleKey ||
  config.supabaseServiceRoleKey === "your_supabase_service_role_key" ||
  config.supabaseServiceRoleKey === "placeholder-key";

// In-memory fallback dataset for robust local development
const mockDb = {
  complaints: [
    {
      id: "a90b4391-4567-4221-a1d2-b677a29e1024",
      complaint_id: "RC-1024",
      title: "Hazardous Pothole on Indiranagar 100ft Road",
      description: "Deep pothole causing vehicle damage and lane swerving.",
      category: "pothole",
      department: "Roads & Highways",
      latitude: 12.9716,
      longitude: 77.6412,
      address: "Indiranagar 100ft Rd, Bengaluru, Karnataka",
      status: "in_progress",
      priority: "high",
      is_urgent: true,
      image_url: "/images/pothole-defect.jpg",
      assigned_officer_id: "23c1092f-b441-45c1-92e1-458bb319c801",
      assigned_officer_name: "Ravi Kumar",
      user_id: "e4b2d130-1092-4f3b-8215-6d0e82c819a1",
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "a90b4391-4567-4221-a1d2-b677a29e1023",
      complaint_id: "RC-1023",
      title: "Severe Road Crack across Lane",
      description: "Longitudinal and alligator cracks widening.",
      category: "road_cracks",
      department: "Roads & Highways",
      latitude: 12.9352,
      longitude: 77.6245,
      address: "Koramangala 4th Block, Bengaluru",
      status: "pending",
      priority: "medium",
      is_urgent: false,
      image_url: "/images/pothole-defect.jpg",
      assigned_officer_id: null,
      assigned_officer_name: null,
      user_id: "e4b2d130-1092-4f3b-8215-6d0e82c819a1",
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "a90b4391-4567-4221-a1d2-b677a29e1022",
      complaint_id: "RC-1022",
      title: "Blocked Storm Drainage Hazard",
      description: "Open drain overflowing onto curb.",
      category: "drainage",
      department: "Stormwater Drainage",
      latitude: 12.9121,
      longitude: 77.6446,
      address: "HSR Layout Sector 1, Bengaluru",
      status: "resolved",
      priority: "low",
      is_urgent: false,
      image_url: "/images/pothole-defect.jpg",
      completion_image_url: "/images/pothole-repaired.jpg",
      admin_remark: "Drain cleared and asphalt patching completed.",
      assigned_officer_id: "23c1092f-b441-45c1-92e1-458bb319c801",
      assigned_officer_name: "Ravi Kumar",
      user_id: "e4b2d130-1092-4f3b-8215-6d0e82c819a1",
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      resolved_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],
  complaint_status_history: [
    {
      id: "h1",
      complaint_id: "a90b4391-4567-4221-a1d2-b677a29e1024",
      old_status: null,
      new_status: "pending",
      changed_by: "citizen",
      actor_name: "Citizen Ravi",
      remark: "Citizen reported issue.",
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ],
  audit_logs: [],
  detection_events: [],
  notifications: [],
  user_roles: [
    { user_id: "e4b2d130-1092-4f3b-8215-6d0e82c819a1", role: "citizen" },
    { user_id: "23c1092f-b441-45c1-92e1-458bb319c801", role: "officer" },
    { user_id: "d9a3b814-3110-482a-a92c-54a7c1b82092", role: "admin" },
  ],
  profiles: [
    { user_id: "e4b2d130-1092-4f3b-8215-6d0e82c819a1", full_name: "Citizen Ravi" },
    { user_id: "23c1092f-b441-45c1-92e1-458bb319c801", full_name: "Ravi Kumar (Field Officer)" },
    { user_id: "d9a3b814-3110-482a-a92c-54a7c1b82092", full_name: "Anita Sharma (Municipal Admin)" },
  ],
};

function createMockQueryBuilder(table) {
  let records = mockDb[table] || [];
  let filters = [];
  let isInsert = false;
  let isUpdate = false;
  let updateData = null;
  let insertedData = null;

  const builder = {
    select: () => builder,
    eq: (col, val) => {
      filters.push((r) => r[col] === val);
      return builder;
    },
    order: () => builder,
    limit: (n) => {
      records = records.slice(0, n);
      return builder;
    },
    insert: (data) => {
      isInsert = true;
      const toInsert = Array.isArray(data) ? data : [data];
      const withIds = toInsert.map((item) => ({
        id: item.id || `id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        created_at: item.created_at || new Date().toISOString(),
        ...item,
      }));
      mockDb[table] = [...withIds, ...(mockDb[table] || [])];
      insertedData = Array.isArray(data) ? withIds : withIds[0];
      return builder;
    },
    update: (data) => {
      isUpdate = true;
      updateData = data;
      return builder;
    },
    single: async () => {
      const res = await builder;
      const item = Array.isArray(res.data) ? res.data[0] : res.data;
      return { data: item || null, error: null };
    },
    maybeSingle: async () => {
      const res = await builder;
      const item = Array.isArray(res.data) ? res.data[0] : res.data;
      return { data: item || null, error: null };
    },
    then: (resolve) => {
      let result = mockDb[table] || [];
      if (isInsert) {
        resolve({ data: insertedData, error: null });
        return;
      }
      if (isUpdate) {
        mockDb[table] = (mockDb[table] || []).map((r) => {
          const match = filters.every((fn) => fn(r));
          return match ? { ...r, ...updateData, updated_at: new Date().toISOString() } : r;
        });
        const matched = mockDb[table].filter((r) => filters.every((fn) => fn(r)));
        resolve({ data: matched[0] || null, error: null });
        return;
      }
      for (const fn of filters) {
        result = result.filter(fn);
      }
      resolve({ data: result, error: null });
    },
  };

  return builder;
}

export const supabaseAdmin = isPlaceholder
  ? {
      from: (table) => createMockQueryBuilder(table),
      auth: {
        getUser: async () => ({ data: { user: null }, error: new Error("Local mode") }),
      },
    }
  : realClient;
