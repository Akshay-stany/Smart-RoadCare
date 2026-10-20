import { useState, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import MapView from "@/components/MapView";
import { useComplaints } from "@/hooks/useComplaints";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Filter } from "lucide-react";
import { CIVIC_CATEGORIES } from "@/services/aiService";

// Demo regional complaints for map visualization matching Screen 5 if DB is empty
const MAP_DEMO_COMPLAINTS = [
  {
    id: "RC-1024",
    complaint_id: "RC-1024",
    title: "Hazardous Pothole on Indiranagar 100ft Road",
    category: "Pothole",
    latitude: 12.9716,
    longitude: 77.6412,
    address: "Indiranagar, Bengaluru, Karnataka",
    status: "in_progress",
    priority: "high",
    image_url: "/images/pothole-defect.jpg",
  },
  {
    id: "RC-1023",
    complaint_id: "RC-1023",
    title: "Severe Road Crack across Lane",
    category: "Road Crack",
    latitude: 12.9352,
    longitude: 77.6245,
    address: "Koramangala 4th Block, Bengaluru",
    status: "pending",
    priority: "medium",
    image_url: "/images/pothole-defect.jpg",
  },
  {
    id: "RC-1022",
    complaint_id: "RC-1022",
    title: "Blocked Storm Drainage Hazard",
    category: "Drainage Issue",
    latitude: 12.9121,
    longitude: 77.6446,
    address: "HSR Layout Sector 1, Bengaluru",
    status: "resolved",
    priority: "low",
    image_url: "/images/pothole-repaired.jpg",
  },
  {
    id: "RC-1021",
    complaint_id: "RC-1021",
    title: "Damaged Road Surface & Gravel",
    category: "Damaged Road",
    latitude: 12.9698,
    longitude: 77.7499,
    address: "Whitefield Main Road, Bengaluru",
    status: "pending",
    priority: "high",
    image_url: "/images/pothole-defect.jpg",
  },
  {
    id: "RC-1020",
    complaint_id: "RC-1020",
    title: "Missing Manhole Cover on MG Road",
    category: "Manhole Cover",
    latitude: 12.9756,
    longitude: 77.6066,
    address: "MG Road, Bengaluru, Karnataka",
    status: "pending",
    priority: "critical",
    image_url: "/images/pothole-defect.jpg",
  },
];

export default function MapPage() {
  const { data: dbComplaints = [], isLoading } = useComplaints();

  // Filters matching Screen 5
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const complaints =
    dbComplaints.length > 0 ? dbComplaints : MAP_DEMO_COMPLAINTS;

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
      if (
        categoryFilter !== "all" &&
        c.category?.toLowerCase() !== categoryFilter.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = c.title?.toLowerCase().includes(query);
        const matchAddr = c.address?.toLowerCase().includes(query);
        const matchId = c.complaint_id?.toLowerCase().includes(query);
        if (!matchTitle && !matchAddr && !matchId) return false;
      }
      return true;
    });
  }, [complaints, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-7.5rem)] space-y-4">
        {/* Top Filter Bar matching Screen 5 */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              Filter by:
            </span>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36 text-xs font-medium rounded-lg border-slate-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9 w-36 text-xs font-medium rounded-lg border-slate-200">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-40 text-xs font-medium rounded-lg border-slate-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CIVIC_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Location Input matching Screen 5 */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-lg border-slate-200 focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        {/* Map Container with Legend matching Screen 5 */}
        <div className="relative flex-1 rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-100">
          {/* Map Overlay Legend */}
          <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200/90 shadow-sm text-xs font-semibold space-y-2 pointer-events-auto">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Resolved</span>
            </div>
          </div>

          <MapView
            complaints={filteredComplaints}
            className="w-full h-full"
            zoom={12}
          />
        </div>
      </div>
    </AppShell>
  );
}
