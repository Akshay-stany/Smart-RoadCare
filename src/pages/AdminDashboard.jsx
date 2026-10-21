import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import PriorityBadge from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useComplaints } from "@/hooks/useComplaints";
import MapView, { statusColors } from "@/components/MapView";
import AdminUsersView from "@/components/admin/AdminUsersView";
import {
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Filter,
  Eye,
  UserCheck,
  TrendingUp,
  MapPin,
  ListFilter,
  X,
  Users,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminDashboard() {
  const location = useLocation();
  const { data: complaints = [], isLoading } = useComplaints();

  // If URL is /admin/users, render the Users Management view
  const isUsersView = location.pathname.startsWith("/admin/users");

  // Interactive Statistic Card Filter: 'all' | 'pending' | 'in_progress' | 'resolved'
  const [statusFilter, setStatusFilter] = useState("all");

  // Year Selection for Complaints Graph
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Toggle between Table View & Interactive Map on Dashboard
  const [showEmbeddedMap, setShowEmbeddedMap] = useState(false);

  // Calculate actual counts from database records
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const inProgressCount = complaints.filter((c) => c.status === "in_progress").length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;

  // Filter complaints for triage table
  const displayedComplaints = useMemo(() => {
    if (statusFilter === "all") return complaints;
    return complaints.filter((c) => c.status === statusFilter);
  }, [complaints, statusFilter]);

  // Available years: 2000 to 2026 (descending) plus any dataset years
  const availableYears = useMemo(() => {
    const years = [];
    const maxYear = Math.max(2026, new Date().getFullYear());
    for (let yr = maxYear; yr >= 2000; yr--) {
      years.push(yr.toString());
    }
    complaints.forEach((c) => {
      if (c.created_at) {
        const y = new Date(c.created_at).getFullYear().toString();
        if (y && !isNaN(y) && !years.includes(y)) {
          years.push(y);
        }
      }
    });
    return years.sort((a, b) => Number(b) - Number(a));
  }, [complaints]);

  // Calculate real year-wise month-by-month stats
  const yearMonthlyChartData = useMemo(() => {
    const yearNum = Number(selectedYear);
    return MONTH_NAMES.map((month, idx) => {
      const matchingInMonth = complaints.filter((c) => {
        if (!c.created_at) return false;
        const d = new Date(c.created_at);
        return d.getFullYear() === yearNum && d.getMonth() === idx;
      });

      const pending = matchingInMonth.filter((c) => c.status === "pending").length;
      const in_progress = matchingInMonth.filter((c) => c.status === "in_progress").length;
      const resolved = matchingInMonth.filter((c) => c.status === "resolved").length;

      return {
        month,
        Pending: pending,
        "In Progress": in_progress,
        Resolved: resolved,
        Total: matchingInMonth.length,
      };
    });
  }, [complaints, selectedYear]);

  // Compute category distribution from real database records
  const categoryDistribution = useMemo(() => {
    if (complaints.length === 0) {
      return [{ name: "No Defects Reported", value: 100, color: "#94A3B8" }];
    }

    const counts = {};
    complaints.forEach((c) => {
      const cat = c.category || "Pothole";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const colors = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#64748B"];
    return Object.entries(counts).map(([name, count], index) => ({
      name,
      value: Math.round((count / complaints.length) * 100),
      rawCount: count,
      color: colors[index % colors.length],
    }));
  }, [complaints]);

  if (isUsersView) {
    return (
      <AppShell>
        <PageHeader
          title="User Management"
          description="Registered citizen and municipal staff accounts with real-time active presence tracking"
          actions={
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700 h-10 px-3.5 rounded-xl font-medium"
            >
              <Link to="/admin">
                <FileText className="w-4 h-4 mr-1.5" />
                Back to Dashboard
              </Link>
            </Button>
          }
        />
        <AdminUsersView />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Overview of road complaints and maintenance activities"
        actions={
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowEmbeddedMap((v) => !v)}
              className={`border-slate-300 h-10 px-3.5 rounded-xl font-medium transition-all ${
                showEmbeddedMap ? "bg-slate-900 text-white border-slate-900" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <MapPin className="w-4 h-4 mr-1.5 text-emerald-600" />
              {showEmbeddedMap ? "Hide Map View" : "Live Map View"}
            </Button>
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4 rounded-xl shadow-xs"
            >
              <Link to="/admin/complaints">
                <FileText className="w-4 h-4 mr-1.5" />
                Manage All Complaints
              </Link>
            </Button>
          </div>
        }
      />

      {/* Embedded Google Map-Like Visualization (Toggled from Top Button) */}
      {showEmbeddedMap && (
        <Card className="bg-white border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden mb-8 animate-fade-in">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Live Road Defects Geographic Visualization
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Accurate latitude & longitude markers with Google Map style tiles & real-time status colors
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmbeddedMap(false)}
              className="h-8 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
          </CardHeader>
          <CardContent className="p-3">
            <MapView complaints={complaints} className="h-[420px] w-full rounded-xl" zoom={12} />
          </CardContent>
        </Card>
      )}

      {/* 4 Interactive Stat Cards:
          - Total Complaints (shows all)
          - Pending (shows pending)
          - In Progress (shows in progress)
          - Resolved (shows resolved)
          Calculated using actual database records, not hardcoded numbers.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Complaints"
          value={totalCount.toString()}
          icon={FileText}
          iconBg="bg-blue-50 text-blue-600"
          trend="Click to filter all"
          trendDirection="up"
          onClick={() => setStatusFilter("all")}
          active={statusFilter === "all"}
        />

        <StatCard
          title="Pending"
          value={pendingCount.toString()}
          icon={Clock}
          iconBg="bg-amber-50 text-amber-600"
          trend="Click to filter pending"
          trendDirection="up"
          onClick={() => setStatusFilter("pending")}
          active={statusFilter === "pending"}
        />

        <StatCard
          title="In Progress"
          value={inProgressCount.toString()}
          icon={RefreshCw}
          iconBg="bg-rose-50 text-rose-600"
          trend="Click to filter in progress"
          trendDirection="down"
          onClick={() => setStatusFilter("in_progress")}
          active={statusFilter === "in_progress"}
        />

        <StatCard
          title="Resolved"
          value={resolvedCount.toString()}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
          trend="Click to filter resolved"
          trendDirection="up"
          onClick={() => setStatusFilter("resolved")}
          active={statusFilter === "resolved"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Complaints Over Time (Year-Wise with 3 Status Series) */}
        <Card className="lg:col-span-7 bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Complaints Over Time
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Database
                  </span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly trend for year {selectedYear} across Pending, In Progress, and Resolved
                </p>
              </div>

              {/* Year-Selection Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Year:</span>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-8 w-28 text-xs font-bold rounded-xl border-slate-200 bg-white">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {availableYears.map((yr) => (
                      <SelectItem key={yr} value={yr} className="text-xs font-semibold cursor-pointer">
                        {yr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearMonthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "none",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      padding: "10px 14px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />

                  {/* 3 Separate Series matching user requirements:
                      Yellow = Pending (#EAB308)
                      Red = In Progress (#EF4444)
                      Green = Resolved (#10B981)
                  */}
                  <Line
                    type="monotone"
                    dataKey="Pending"
                    name="Pending (Yellow)"
                    stroke={statusColors.pending}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: statusColors.pending }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="In Progress"
                    name="In Progress (Red)"
                    stroke={statusColors.in_progress}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: statusColors.in_progress }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Resolved"
                    name="Resolved (Green)"
                    stroke={statusColors.resolved}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: statusColors.resolved }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution (Donut Chart from actual database records) */}
        <Card className="lg:col-span-5 bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900">
              Category Distribution
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of defects across civil infrastructure categories
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="h-64 w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, item) => [`${val}% (${item.payload.rawCount || 0} issues)`, name]}
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        border: "none",
                        borderRadius: "8px",
                        color: "#FFFFFF",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="w-full sm:w-1/2 space-y-2 text-xs">
                {categoryDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-slate-700 truncate max-w-[110px]">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Priority Triage Table (Reactively filtered by active Stat Card) */}
      <Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Priority Triage & Complaints Table</span>
                {statusFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                    Showing: {statusFilter.replace("_", " ").toUpperCase()} ({displayedComplaints.length})
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {statusFilter === "all"
                  ? "Displaying all active and historical complaints from database"
                  : `Filtered view displaying only ${statusFilter.replace("_", " ")} complaints`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {statusFilter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-8 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear Filter
              </Button>
            )}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700 font-bold text-xs"
            >
              <Link to="/admin/complaints">Manage All &rarr;</Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Complaint ID</th>
                  <th className="py-3 px-4">Defect & Title</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Loading complaints from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                      No complaints found for status:{" "}
                      <span className="font-bold text-slate-800">
                        {statusFilter.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ) : (
                  displayedComplaints.slice(0, 10).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">
                        #{row.complaint_id || `RC-${row.id.slice(0, 4)}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">
                        <div className="font-semibold">{row.title}</div>
                        <div className="text-xs text-slate-500">{row.category}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs max-w-[200px] truncate">
                        {row.address || `${row.latitude?.toFixed(4)}, ${row.longitude?.toFixed(4)}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={row.priority} />
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 border-slate-200 text-slate-700 hover:text-emerald-600 rounded-lg text-xs font-semibold"
                        >
                          <Link to={`/admin/complaints/${row.complaint_id || row.id}`}>Review</Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
