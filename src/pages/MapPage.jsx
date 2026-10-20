import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import MapView from "@/components/MapView";
import { useComplaints } from "@/hooks/useComplaints";
import { fetchCurrentPosition } from "@/hooks/useGeolocation";
import StatusBadge from "@/components/common/StatusBadge";
import PriorityBadge from "@/components/common/PriorityBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Filter, Navigation2, Layers, Plus, X, ArrowRight, Eye, ShieldAlert } from "lucide-react";
import { CIVIC_CATEGORIES } from "@/services/aiService";
import { toast } from "sonner";

export default function MapPage() {
  const { data: complaints = [], isLoading } = useComplaints();

  // Filters matching Screen 5
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

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

  const handleLocateMe = async () => {
    setLocating(true);
    toast.info("Centering on your GPS location...");
    try {
      const pos = await fetchCurrentPosition();
      const coords = [pos.coords.latitude, pos.coords.longitude];
      setUserLocation(coords);
      toast.success("GPS location locked!");
    } catch {
      toast.error("GPS signal unavailable.");
    } finally {
      setLocating(false);
    }
  };

  const handleMarkerClick = useCallback((lat, lng) => {
    // Find closest complaint
    const match = complaints.find(
      (c) => Math.abs(c.latitude - lat) < 0.001 && Math.abs(c.longitude - lng) < 0.001
    );
    if (match) {
      setSelectedComplaint(match);
    }
  }, [complaints]);

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-7.5rem)] space-y-3 relative">
        {/* Top Floating Filter & Search Bar matching Screen 5 */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 relative z-30">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              Filter by:
            </span>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-32 text-xs font-medium rounded-lg border-slate-200">
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
              <SelectTrigger className="h-9 w-32 text-xs font-medium rounded-lg border-slate-200">
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
              <SelectTrigger className="h-9 w-36 text-xs font-medium rounded-lg border-slate-200">
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
              placeholder="Search location, road, #RC-..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-lg border-slate-200 focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        {/* Full Mobile Geomap Canvas */}
        <div className="relative flex-1 rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-100">
          {/* Map Priority Legend matching Screen 5 */}
          <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200/90 shadow-sm text-xs font-semibold space-y-1.5 pointer-events-auto">
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

          {/* Floating Mobile Controls (Locate Me + Report FAB) */}
          <div className="absolute bottom-6 right-4 z-[400] flex flex-col gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleLocateMe}
              disabled={locating}
              className="w-11 h-11 rounded-full bg-white text-slate-700 shadow-md border-slate-200 hover:bg-slate-50 hover:text-emerald-600"
              title="Locate Me"
            >
              <Navigation2 className={`w-5 h-5 text-emerald-600 ${locating ? "animate-spin" : ""}`} />
            </Button>
            <Link to="/report">
              <Button
                type="button"
                className="h-11 px-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Report Issue</span>
              </Button>
            </Link>
          </div>

          {/* Interactive Mobile Slide-up Bottom Sheet when a Complaint Marker is Tapped */}
          {selectedComplaint && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-[500] animate-fade-in pointer-events-auto">
              <div className="bg-white/98 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xl flex gap-3.5 items-center relative">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>

                <img
                  src={selectedComplaint.image_url || "/images/pothole-defect.jpg"}
                  alt={selectedComplaint.title}
                  className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-200"
                />

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-xs font-extrabold text-slate-900">
                      #{selectedComplaint.complaint_id}
                    </span>
                    <PriorityBadge priority={selectedComplaint.priority} />
                    <StatusBadge status={selectedComplaint.status} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 truncate">
                    {selectedComplaint.title}
                  </h4>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {selectedComplaint.address}
                  </p>

                  <Link
                    to={`/complaints/${selectedComplaint.complaint_id || selectedComplaint.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 mt-2"
                  >
                    View Details & Timeline
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          <MapView
            complaints={filteredComplaints}
            className="w-full h-full"
            selectedPosition={userLocation}
            center={userLocation || undefined}
            onMapClick={handleMarkerClick}
            zoom={12}
          />
        </div>
      </div>
    </AppShell>
  );
}
