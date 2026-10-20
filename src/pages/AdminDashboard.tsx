import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";
import { useComplaints, useUpdateComplaint, useDeleteComplaint } from "@/hooks/useComplaints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

type ComplaintStatus = Database["public"]["Enums"]["complaint_status"];
type ComplaintPriority = Database["public"]["Enums"]["complaint_priority"];

const STATUS_COLORS = { pending: "#ef4444", in_progress: "#f59e0b", resolved: "#22c55e" };
const PRIORITY_COLORS = { low: "#94a3b8", medium: "#f59e0b", high: "#ef4444" };

export default function AdminDashboard() {
  const { role } = useAuth();
  const { data: complaints, isLoading } = useComplaints();
  const updateComplaint = useUpdateComplaint();
  const deleteComplaint = useDeleteComplaint();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [remarkId, setRemarkId] = useState<string | null>(null);
  const [remarkText, setRemarkText] = useState("");

  if (role !== "admin") {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">Access denied. Admin only.</p></div>;
  }

  const filtered = complaints?.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search && !c.complaint_id.toLowerCase().includes(search.toLowerCase()) && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = complaints?.length ?? 0;
  const resolved = complaints?.filter((c) => c.status === "resolved").length ?? 0;
  const resolvedPct = total ? Math.round((resolved / total) * 100) : 0;

  // Chart data
  const statusData = ["pending", "in_progress", "resolved"].map((s) => ({
    name: s.replace("_", " "),
    value: complaints?.filter((c) => c.status === s).length ?? 0,
    color: STATUS_COLORS[s as keyof typeof STATUS_COLORS],
  }));

  // Complaints over time (last 7 days)
  const timeData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dayStr = format(d, "MMM d");
    const count = complaints?.filter((c) => format(new Date(c.created_at), "MMM d") === dayStr).length ?? 0;
    return { date: dayStr, count };
  });


  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateComplaint.mutateAsync({ id, status: status as ComplaintStatus });
      toast.success("Status updated — user notified");
    } catch { toast.error("Failed to update"); }
  };

  const handleSaveRemark = async (id: string) => {
    try {
      await updateComplaint.mutateAsync({ id, admin_remark: remarkText });
      toast.success("Remark saved");
      setRemarkId(null);
      setRemarkText("");
    } catch { toast.error("Failed to save remark"); }
  };

  const handlePriorityChange = async (id: string, priority: string) => {
    try {
      await updateComplaint.mutateAsync({ id, priority: priority as ComplaintPriority });
      toast.success("Priority updated");
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this complaint?")) return;
    try {
      await deleteComplaint.mutateAsync(id);
      toast.success("Complaint deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage all reported road issues</p>
      </div>

      {/* Analytics */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Resolution Rate</h3>
          <p className="text-3xl font-bold text-card-foreground">{resolvedPct}%</p>
          <p className="text-xs text-muted-foreground">{resolved} of {total} resolved</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50}>
                {statusData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Reports This Week</h3>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="hsl(220, 70%, 25%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Image</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title / Location</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Remark</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{c.complaint_id}</td>
                  <td className="px-4 py-3">
                    {c.image_url ? (
                      <img src={c.image_url} alt="" className="h-10 w-14 rounded object-cover border" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="truncate font-medium">{c.title}{c.is_urgent && " 🚨"}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.address || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={c.status} onValueChange={(v) => handleStatusChange(c.id, v)}>
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={c.priority} onValueChange={(v) => handlePriorityChange(c.id, v)}>
                      <SelectTrigger className="h-8 w-[100px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{format(new Date(c.created_at), "MMM d, yyyy")}</div>
                    <div>{format(new Date(c.created_at), "hh:mm a")}</div>
                  </td>
                  <td className="px-4 py-3">
                    {remarkId === c.id ? (
                      <div className="flex gap-1">
                        <Input value={remarkText} onChange={(e) => setRemarkText(e.target.value)} placeholder="Add remark..." className="h-8 text-xs w-32" />
                        <Button size="sm" className="h-8 text-xs" onClick={() => handleSaveRemark(c.id)}>Save</Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setRemarkId(c.id); setRemarkText(c.admin_remark || ""); }}
                        className="text-xs text-muted-foreground hover:text-foreground max-w-[120px] truncate block"
                        title={c.admin_remark || "Add remark"}
                      >
                        {c.admin_remark || "＋ Add remark"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered?.length === 0 && <p className="text-center py-8 text-muted-foreground">No complaints found</p>}
        </div>
      )}
    </div>
  );
}
