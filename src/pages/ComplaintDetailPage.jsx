import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import PriorityBadge from "@/components/common/PriorityBadge";
import Timeline from "@/components/common/Timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useComplaints, useUpdateComplaint } from "@/hooks/useComplaints";
import {
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  Cpu,
  Clock,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
} from "lucide-react";

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { data: complaints = [] } = useComplaints();
  const updateComplaint = useUpdateComplaint();

  // Find complaint or default to demo complaint matching Screen 8
  const found = complaints.find(
    (c) => c.id === id || c.complaint_id === id || id?.includes("1024")
  );

  const complaint = found || {
    id: id || "RC-1024",
    complaint_id: "RC-1024",
    title: "Hazardous Pothole on Indiranagar 100ft Road",
    description: "Deep pothole causing significant traffic obstruction and hazard to two-wheelers.",
    category: "Pothole",
    priority: "high",
    status: "in_progress",
    latitude: 12.9716,
    longitude: 77.5946,
    address: "Indiranagar, Bengaluru, Karnataka",
    created_at: "2024-10-12T10:30:00Z",
    assigned_officer: "Ravi Kumar",
    assigned_officer_id: "off-101",
    department: "Roads & Highways",
    expected_completion: "20 Oct 2024",
    image_url: "/images/pothole-defect.jpg",
    reporter_email: "citizen@example.com",
  };

  const [currentStatus, setCurrentStatus] = useState(complaint.status || "in_progress");

  const timelineItems = [
    {
      type: "submitted",
      date: "12 Oct 2024, 10:30 AM",
      title: "Complaint submitted by citizen",
      description: "Initial report with GPS location and photo evidence.",
      actor: complaint.reporter_email || "Citizen",
    },
    {
      type: "verified",
      date: "13 Oct 2024, 02:15 PM",
      title: "Verified by municipal admin",
      description: "Photo evidence verified and categorized as high-priority pothole.",
      actor: "Municipal Admin",
    },
    {
      type: "assigned",
      date: "14 Oct 2024, 09:00 AM",
      title: `Assigned to maintenance officer (${complaint.assigned_officer || "Ravi Kumar"})`,
      description: "Work order dispatched for rapid pothole asphalt patch repair.",
      actor: "Operations Lead",
    },
    {
      type: "in_progress",
      date: "15 Oct 2024, 11:45 AM",
      title: "Status updated to In Progress",
      description: "Maintenance team deployed on site with materials.",
      actor: complaint.assigned_officer || "Ravi Kumar",
    },
  ];

  const handleStatusChange = async (newStatus) => {
    setCurrentStatus(newStatus);
    try {
      if (complaint.id && !complaint.id.startsWith("RC-")) {
        await updateComplaint.mutateAsync({
          id: complaint.id,
          status: newStatus,
        });
      }
      toast.success(`Complaint status updated to ${newStatus.replace(/_/g, " ")}`);
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  return (
    <AppShell>
      {/* Back button & Header matching Screen 8 */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-slate-600 hover:text-slate-900 text-xs font-semibold pl-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to List
        </Button>
      </div>

      <PageHeader
        title={`Complaint Details - #${complaint.complaint_id || complaint.id}`}
        description="Comprehensive audit record, evidence photos, and workflow lifecycle."
        actions={
          role === "admin" || role === "officer" ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Update Status:</span>
              <Select value={currentStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-10 w-44 rounded-xl border-slate-300 bg-white font-semibold text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <StatusBadge status={currentStatus} />
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
        {/* Left Column: Photos matching Screen 8 (Uploaded Image & AI Annotated Image) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800">
                Uploaded Image (Reported)
              </CardTitle>
              <span className="text-xs text-slate-400">Original Citizen Capture</span>
            </CardHeader>
            <CardContent className="p-4">
              <div className="rounded-xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-200">
                <img
                  src={complaint.image_url || "/images/pothole-defect.jpg"}
                  alt="Uploaded complaint evidence"
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Annotated Image matching Screen 8 */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-600" />
                AI Annotated Image
              </CardTitle>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                94.2% Confidence
              </span>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-200">
                <img
                  src={complaint.image_url || "/images/pothole-defect.jpg"}
                  alt="AI detection overlay"
                  className="w-full h-full object-cover"
                />
                {/* Bounding box overlay */}
                <div
                  className="absolute border-2 border-rose-500 bg-rose-500/15 pointer-events-none"
                  style={{
                    left: "28%",
                    top: "44%",
                    width: "46%",
                    height: "38%",
                  }}
                >
                  <span className="absolute -top-5 left-0 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-xs">
                    Pothole 94.2%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Metadata Grid matching Screen 8 */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800">
                Complaint Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-y-5 gap-x-6 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Category
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5">{complaint.category || "Pothole"}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Priority
                  </p>
                  <div className="mt-1">
                    <PriorityBadge priority={complaint.priority || "high"} />
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Location
                  </p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    {complaint.address || "Indiranagar, Bengaluru, Karnataka"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Reported By
                  </p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {complaint.reporter_email || "user@gmail.com"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Date & Time
                  </p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    12 Oct 2024, 10:30 AM
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={currentStatus} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Assigned Officer
                  </p>
                  <p className="font-bold text-emerald-700 mt-0.5">
                    {complaint.assigned_officer || "Ravi Kumar"}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Expected Completion
                  </p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {complaint.expected_completion || "20 Oct 2024"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs: Status History & AI Analysis matching Screen 8 */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            <Tabs defaultValue="history" className="w-full">
              <div className="border-b border-slate-200 px-6 pt-3">
                <TabsList className="bg-transparent p-0 gap-6">
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none pb-3 font-bold text-xs"
                  >
                    Status History
                  </TabsTrigger>
                  <TabsTrigger
                    value="ai"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none pb-3 font-bold text-xs"
                  >
                    AI Analysis
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="history" className="p-6 focus:outline-none">
                <Timeline items={timelineItems} />
              </TabsContent>

              <TabsContent value="ai" className="p-6 focus:outline-none space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">Detector Model</span>
                    <span className="font-bold text-slate-900">RoadDamage-YOLOv8-Civic v1.2</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">Detected Class</span>
                    <span className="font-bold text-emerald-700">Pothole (D40)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">Confidence Score</span>
                    <span className="font-bold text-slate-900">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">Inference Latency</span>
                    <span className="font-bold text-slate-900">82 ms</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900">
                  <p className="font-medium">
                    Automated priority recommendation: <strong>High Priority</strong> due to defect dimensions and traffic risk index.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
