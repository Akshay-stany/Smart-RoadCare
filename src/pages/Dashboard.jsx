import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import PriorityBadge from "@/components/common/PriorityBadge";
import EmptyState from "@/components/common/EmptyState";
import MapView from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMyComplaints, useComplaints } from "@/hooks/useComplaints";
import {
  Plus,
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  MapPin,
  Camera,
  ArrowRight,
  ShieldCheck,
  Eye,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: userComplaints = [], isLoading: userLoading } = useMyComplaints(user?.id);
  const { data: allComplaints = [] } = useComplaints();

  // Personal metrics
  const myTotal = userComplaints.length;
  const myPending = userComplaints.filter((c) => c.status === "pending").length;
  const myInProgress = userComplaints.filter((c) => c.status === "in_progress").length;
  const myResolved = userComplaints.filter((c) => c.status === "resolved").length;

  // Safe public map slice (stripping any sensitive reporter info)
  const safeMapComplaints = useMemo(() => {
    return allComplaints.map((c) => ({
      id: c.id,
      complaint_id: c.complaint_id,
      title: c.title,
      category: c.category || "Road Defect",
      latitude: c.latitude,
      longitude: c.longitude,
      status: c.status,
      priority: c.priority,
      image_url: c.image_url,
      address: c.address,
    }));
  }, [allComplaints]);

  return (
    <AppShell>
      <PageHeader
        title="Citizen Dashboard"
        description="Monitor your reported road hazards, track civic maintenance, and view nearby issues."
        actions={
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="border-slate-300 text-slate-700 h-10 px-4 rounded-xl font-medium"
            >
              <Link to="/map">
                <MapPin className="w-4 h-4 mr-1.5 text-emerald-600" />
                Explore City Map
              </Link>
            </Button>
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4 rounded-xl shadow-sm"
            >
              <Link to="/report">
                <Plus className="w-4 h-4 mr-1.5" />
                Report New Issue
              </Link>
            </Button>
          </div>
        }
      />

      {/* 4 Personal Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="My Open Reports"
          value={myTotal}
          icon={FileText}
          iconBg="bg-blue-50 text-blue-600"
          trend="Total submitted by you"
          trendDirection="up"
        />
        <StatCard
          title="Awaiting Verification"
          value={myPending}
          icon={Clock}
          iconBg="bg-amber-50 text-amber-600"
          trend="Under municipal triage"
          trendDirection="up"
        />
        <StatCard
          title="In Progress"
          value={myInProgress}
          icon={RefreshCw}
          iconBg="bg-sky-50 text-sky-600"
          trend="Officer dispatched"
          trendDirection="up"
        />
        <StatCard
          title="Resolved"
          value={myResolved}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
          trend="Repairs completed"
          trendDirection="up"
        />
      </div>

      {/* Quick Action Shortcuts Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Link
          to="/report"
          className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div>
            <h3 className="font-bold text-lg">Report Road Defect</h3>
            <p className="text-xs text-emerald-100 mt-1">
              Upload photo, AI detection & GPS pin
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 text-white" />
          </div>
        </Link>

        <Link
          to="/live-detection"
          className="bg-white border border-slate-200/90 text-slate-900 p-5 rounded-2xl shadow-2xs hover:shadow-sm transition-all group flex items-center justify-between"
        >
          <div>
            <h3 className="font-bold text-lg">Live AI Camera</h3>
            <p className="text-xs text-slate-500 mt-1">
              Real-time pothole scanning via webcam
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
        </Link>

        <Link
          to="/my-complaints"
          className="bg-white border border-slate-200/90 text-slate-900 p-5 rounded-2xl shadow-2xs hover:shadow-sm transition-all group flex items-center justify-between"
        >
          <div>
            <h3 className="font-bold text-lg">My Complaints List</h3>
            <p className="text-xs text-slate-500 mt-1">
              View status timeline and repair evidence
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ArrowRight className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* 2-Column: Recently Reported by Citizen & Nearby Public Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Recent Issues */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Recently Reported by You
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your most recent civic maintenance submissions
                </p>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold"
              >
                <Link to="/my-complaints">View All &rarr;</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {userComplaints.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No complaints reported yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Notice a pothole or hazard? Report it to dispatch road crews.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                  >
                    <Link to="/report">Report an Issue</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {userComplaints.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img
                            src={item.image_url || "/images/pothole-defect.jpg"}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            #{item.complaint_id || `RC-${item.id.slice(0, 4)}`} • {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.address || "Reported coordinates"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={item.status} />
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600"
                        >
                          <Link to={`/complaints/${item.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Safe Public Issue Map */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Nearby Public Road Issues
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified road hazards reported across the region
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="text-xs border-slate-200 font-semibold"
              >
                <Link to="/map">Full Screen Map</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[360px] w-full">
                <MapView
                  complaints={safeMapComplaints}
                  className="w-full h-full"
                  zoom={12}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
