import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import PriorityBadge from "@/components/common/PriorityBadge";
import LoadingState from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useComplaints } from "@/hooks/useComplaints";
import { Plus, Eye, MapPin, Calendar, FileText } from "lucide-react";

// Demo records matching reference Screen 6 if database has no rows
const DEMO_COMPLAINTS = [
  {
    id: "demo-1",
    complaint_id: "RC-1024",
    title: "Deep Pothole at Main Junction",
    category: "Pothole",
    location_name: "Indiranagar, BLR",
    address: "Indiranagar, Bengaluru, Karnataka",
    status: "in_progress",
    priority: "high",
    created_at: "2024-10-12T10:30:00Z",
    image_url: "/images/pothole-defect.jpg",
  },
  {
    id: "demo-2",
    complaint_id: "RC-1023",
    title: "Severe Road Crack across Lane",
    category: "Road Crack",
    location_name: "Koramangala, BLR",
    address: "Koramangala, Bengaluru, Karnataka",
    status: "pending",
    priority: "medium",
    created_at: "2024-10-10T14:15:00Z",
    image_url: "/images/pothole-defect.jpg",
  },
  {
    id: "demo-3",
    complaint_id: "RC-1022",
    title: "Blocked Storm Drainage Hazard",
    category: "Drainage Issue",
    location_name: "HSR Layout, BLR",
    address: "HSR Layout, Bengaluru, Karnataka",
    status: "resolved",
    priority: "low",
    created_at: "2024-10-05T09:00:00Z",
    image_url: "/images/pothole-repaired.jpg",
  },
  {
    id: "demo-4",
    complaint_id: "RC-1021",
    title: "Damaged Road Surface & Gravel",
    category: "Damaged Road",
    location_name: "Whitefield, BLR",
    address: "Whitefield, Bengaluru, Karnataka",
    status: "pending",
    priority: "high",
    created_at: "2024-10-01T16:40:00Z",
    image_url: "/images/pothole-defect.jpg",
  },
];

export default function MyComplaintsPage() {
  const { user } = useAuth();
  const { data: dbComplaints, isLoading } = useComplaints(user?.id);
  const [activeTab, setActiveTab] = useState("all");

  const complaints =
    dbComplaints && dbComplaints.length > 0 ? dbComplaints : DEMO_COMPLAINTS;

  const counts = {
    all: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    in_progress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  const filtered = complaints.filter((c) => {
    if (activeTab === "all") return true;
    return c.status === activeTab;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "12 Oct 2024";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AppShell>
      <PageHeader
        title="My Complaints"
        description="Track the status of your reported issues."
        actions={
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-5 shadow-sm flex items-center gap-2"
          >
            <Link to="/report">
              <Plus className="w-4 h-4" />
              Report New Issue
            </Link>
          </Button>
        }
      />

      {/* Tabs matching Screen 6 */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-3 mb-6 overflow-x-auto">
        {[
          { key: "all", label: `All (${counts.all})` },
          { key: "pending", label: `Pending (${counts.pending})` },
          { key: "in_progress", label: `In Progress (${counts.in_progress})` },
          { key: "resolved", label: `Resolved (${counts.resolved})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState message="Fetching your reported complaints..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No complaints in this category"
          description="You haven't reported any issues matching this filter yet."
          actionLabel="Report a Road Issue"
          onAction={() => {}}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-5">ID</th>
                  <th className="py-4 px-4">Image</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Location</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Priority</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Complaint ID */}
                    <td className="py-4 px-5 font-bold text-slate-900 whitespace-nowrap">
                      #{item.complaint_id || `RC-${item.id.slice(0, 4)}`}
                    </td>

                    {/* Image thumbnail */}
                    <td className="py-4 px-4">
                      <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={item.image_url || "/images/pothole-defect.jpg"}
                          alt={item.title || "Complaint"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 text-slate-800 whitespace-nowrap">
                      {item.category || "Pothole"}
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 text-slate-600 max-w-xs truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {item.location_name ||
                            item.address ||
                            `${item.latitude?.toFixed(2)}, ${item.longitude?.toFixed(2)}`}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Priority Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <PriorityBadge priority={item.priority} />
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>

                    {/* View Action */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 font-semibold rounded-lg"
                      >
                        <Link to={`/complaints/${item.id}`}>
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
