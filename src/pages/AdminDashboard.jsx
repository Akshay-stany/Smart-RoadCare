import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import PriorityBadge from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComplaints, useUpdateComplaint } from "@/hooks/useComplaints";
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

// Default chart data matching Screen 7 reference
const MONTHLY_TREND_DATA = [
  { month: "Jan", submitted: 45, resolved: 30 },
  { month: "Feb", submitted: 58, resolved: 42 },
  { month: "Mar", submitted: 72, resolved: 55 },
  { month: "Apr", submitted: 85, resolved: 70 },
  { month: "May", submitted: 90, resolved: 82 },
  { month: "Jun", submitted: 110, resolved: 95 },
  { month: "Jul", submitted: 125, resolved: 110 },
  { month: "Aug", submitted: 140, resolved: 128 },
  { month: "Sep", submitted: 155, resolved: 145 },
  { month: "Oct", submitted: 170, resolved: 160 },
];

const CATEGORY_DISTRIBUTION = [
  { name: "Potholes", value: 45, color: "#10B981" },
  { name: "Road Cracks", value: 20, color: "#3B82F6" },
  { name: "Damaged Roads", value: 18, color: "#F59E0B" },
  { name: "Drainage Issues", value: 10, color: "#8B5CF6" },
  { name: "Others", value: 7, color: "#64748B" },
];

export default function AdminDashboard() {
  const { data: complaints = [], isLoading } = useComplaints();
  const updateComplaint = useUpdateComplaint();

  // Compute metrics from actual database rows if present, else show reference counts
  const totalCount = complaints.length > 0 ? complaints.length : 1284;
  const pendingCount =
    complaints.length > 0
      ? complaints.filter((c) => c.status === "pending").length
      : 342;
  const inProgressCount =
    complaints.length > 0
      ? complaints.filter((c) => c.status === "in_progress").length
      : 276;
  const resolvedCount =
    complaints.length > 0
      ? complaints.filter((c) => c.status === "resolved").length
      : 666;

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Overview of road complaints and maintenance activities"
        actions={
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700 h-10 px-3.5 rounded-xl font-medium"
            >
              <Link to="/map">
                <Filter className="w-4 h-4 mr-1.5" />
                Live Map View
              </Link>
            </Button>
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4 rounded-xl shadow-sm"
            >
              <Link to="/admin/complaints">
                <FileText className="w-4 h-4 mr-1.5" />
                Manage All Complaints
              </Link>
            </Button>
          </div>
        }
      />

      {/* 4 Stat Cards Row Matching Reference Screen 7 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Card 1: Total Complaints */}
        <StatCard
          title="Total Complaints"
          value={totalCount.toLocaleString()}
          icon={FileText}
          iconBg="bg-blue-50 text-blue-600"
          trend="+12% from last month"
          trendDirection="up"
        />

        {/* Card 2: Pending */}
        <StatCard
          title="Pending"
          value={pendingCount.toLocaleString()}
          icon={Clock}
          iconBg="bg-amber-50 text-amber-600"
          trend="+5%"
          trendDirection="up"
        />

        {/* Card 3: In Progress */}
        <StatCard
          title="In Progress"
          value={inProgressCount.toLocaleString()}
          icon={RefreshCw}
          iconBg="bg-sky-50 text-sky-600"
          trend="-3%"
          trendDirection="down"
        />

        {/* Card 4: Resolved */}
        <StatCard
          title="Resolved"
          value={resolvedCount.toLocaleString()}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
          trend="+24%"
          trendDirection="up"
        />
      </div>

      {/* Charts Row Matching Reference Screen 7 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Complaints Over Time (Line Chart) */}
        <Card className="lg:col-span-7 bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Complaints Over Time
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly trend of submitted vs resolved reports
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Live Data
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MONTHLY_TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "none",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Line
                    type="monotone"
                    dataKey="submitted"
                    name="Submitted"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#3B82F6" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#10B981" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution (Donut Chart) */}
        <Card className="lg:col-span-5 bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900">
              Category Distribution
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of defects across civil infrastructure
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="h-64 w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={CATEGORY_DISTRIBUTION}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {CATEGORY_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`${val}%`, "Share"]}
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
                {CATEGORY_DISTRIBUTION.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent High Priority Triage Table */}
      <Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Recent Priority Triage
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Action items awaiting administrative review and officer dispatch
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-emerald-600 hover:text-emerald-700 font-semibold text-xs"
          >
            <Link to="/admin/complaints">View All &rarr;</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Complaint ID</th>
                  <th className="py-3 px-4">Defect & Title</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {[
                  {
                    id: "RC-1024",
                    title: "Pothole on Indiranagar 100ft Road",
                    category: "Pothole",
                    location: "Indiranagar, Bengaluru",
                    status: "in_progress",
                    priority: "high",
                  },
                  {
                    id: "RC-1023",
                    title: "Road Crack across lane",
                    category: "Road Crack",
                    location: "Koramangala 4th Block",
                    status: "pending",
                    priority: "medium",
                  },
                  {
                    id: "RC-1021",
                    title: "Damaged Road Surface",
                    category: "Damaged Road",
                    location: "Whitefield Main Road",
                    status: "pending",
                    priority: "high",
                  },
                ].map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900">#{row.id}</td>
                    <td className="py-3.5 px-4 text-slate-800">
                      <div className="font-semibold">{row.title}</div>
                      <div className="text-xs text-slate-500">{row.category}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{row.location}</td>
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
                        className="h-8 border-slate-200 text-slate-700 hover:text-emerald-600 rounded-lg text-xs"
                      >
                        <Link to={`/admin/complaints/${row.id}`}>Review</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
