import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import PriorityBadge from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const ASSIGNED_TASKS = [
  {
    id: "RC-1024",
    title: "Deep Pothole at Main Junction",
    category: "Pothole",
    location: "Indiranagar, Bengaluru",
    priority: "high",
    status: "in_progress",
    due_date: "20 Oct 2024",
    image_url: "/images/pothole-defect.jpg",
  },
  {
    id: "RC-1021",
    title: "Broken Road Surface with Loose Stones",
    category: "Damaged Road",
    location: "Whitefield Main Road",
    priority: "high",
    status: "pending",
    due_date: "22 Oct 2024",
    image_url: "/images/pothole-defect.jpg",
  },
  {
    id: "RC-1019",
    title: "Longitudinal Road Surface Crack",
    category: "Road Crack",
    location: "Koramangala 80ft Road",
    priority: "medium",
    status: "in_progress",
    due_date: "25 Oct 2024",
    image_url: "/images/pothole-defect.jpg",
  },
];

export default function OfficerDashboard() {
  const { user } = useAuth();

  return (
    <AppShell>
      <PageHeader
        title="Field Maintenance Dashboard"
        description="Assigned municipal repair work orders, resolution evidence, and field progress."
        actions={
          <Button
            asChild
            variant="outline"
            className="border-slate-300 text-slate-700 h-10 px-4 rounded-xl font-medium"
          >
            <Link to="/map">
              <MapPin className="w-4 h-4 mr-1.5 text-emerald-600" />
              Open In Field Map
            </Link>
          </Button>
        }
      />

      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          title="Assigned Tasks"
          value="12"
          icon={CheckSquare}
          iconBg="bg-blue-50 text-blue-600"
          trend="3 pending triage"
          trendDirection="up"
        />
        <StatCard
          title="In Progress"
          value="5"
          icon={Clock}
          iconBg="bg-sky-50 text-sky-600"
          trend="2 due today"
          trendDirection="down"
        />
        <StatCard
          title="Resolved This Month"
          value="28"
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
          trend="+18% on-time SLA"
          trendDirection="up"
        />
      </div>

      {/* Tasks Table */}
      <Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Assigned Work Orders
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any work order to upload before/after photos and submit completion
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {ASSIGNED_TASKS.length} Active Tasks
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Order ID</th>
                  <th className="py-3.5 px-4">Evidence</th>
                  <th className="py-3.5 px-4">Title & Category</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {ASSIGNED_TASKS.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900">#{task.id}</td>
                    <td className="py-4 px-4">
                      <div className="w-12 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        <img
                          src={task.image_url}
                          alt={task.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900">{task.title}</div>
                      <div className="text-xs text-slate-500">{task.category}</div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {task.location}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">{task.due_date}</td>
                    <td className="py-4 px-5 text-right">
                      <Button
                        asChild
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs px-3 rounded-lg shadow-2xs"
                      >
                        <Link to={`/officer/tasks/${task.id}`}>
                          Update Work
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
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
