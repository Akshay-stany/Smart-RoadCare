import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import UploadDropzone from "@/components/common/UploadDropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateComplaint } from "@/hooks/useComplaints";
import {
  CheckCircle2,
  MapPin,
  Clock,
  ArrowLeft,
  Upload,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function OfficerTaskPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const updateComplaint = useUpdateComplaint();

  const [currentStatus, setCurrentStatus] = useState("resolved");
  const [remarks, setRemarks] = useState("Pothole repaired successfully with hot-mix asphalt patching.");
  const [afterImageFile, setAfterImageFile] = useState(null);
  const [afterPreview, setAfterPreview] = useState("/images/pothole-repaired.jpg");
  const [submitting, setSubmitting] = useState(false);

  const complaintId = id || "RC-1024";

  const handleResolve = async (e) => {
    e?.preventDefault();
    setSubmitting(true);
    try {
      // In a real flow, upload completion photo and write audit record
      await new Promise((res) => setTimeout(res, 600));
      toast.success(`Work order #${complaintId} marked as Resolved! Completion evidence recorded.`);
      navigate("/officer");
    } catch (err) {
      toast.error(err.message || "Failed to update work order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      {/* Back button */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/officer")}
          className="text-slate-600 hover:text-slate-900 text-xs font-semibold pl-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Assigned Tasks
        </Button>
      </div>

      {/* Header matching Screen 9 */}
      <PageHeader
        title={`Update Work - #${complaintId}`}
        description="Submit completion evidence and update field resolution status"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Current Status:</span>
            <StatusBadge status="in_progress" />
          </div>
        }
      />

      <div className="max-w-4xl space-y-8">
        {/* Upload Completion Photos Section matching Screen 9 */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          <CardHeader className="py-4 px-6 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800">
              Upload Completion Photos (Before & After Comparison)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Before Reported Photo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Before (Reported)</span>
                  <span className="text-[10px] text-slate-400">12 Oct 2024</span>
                </div>
                <div className="rounded-xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-200">
                  <img
                    src="/images/pothole-defect.jpg"
                    alt="Before Reported Defect"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* After Fixed Photo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="text-emerald-700 font-bold">After (Fixed)</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Repaired Evidence</span>
                </div>
                {afterPreview ? (
                  <div className="rounded-xl overflow-hidden aspect-[4/3] bg-slate-900 border-2 border-emerald-500 relative group">
                    <img
                      src={afterPreview}
                      alt="After Repaired Surface"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setAfterPreview(null)}
                        className="bg-white text-slate-800 text-xs font-bold"
                      >
                        Change Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <UploadDropzone
                    onImageSelected={(file) => {
                      setAfterImageFile(file);
                      setAfterPreview(URL.createObjectURL(file));
                    }}
                    previewUrl={null}
                    maxSizeMb={5}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Update Status & Remarks Form matching Screen 9 */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          <CardHeader className="py-4 px-6 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800">
              Resolution Remarks & Final Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Update Status
              </Label>
              <Select value={currentStatus} onValueChange={setCurrentStatus}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">In Progress (Work Ongoing)</SelectItem>
                  <SelectItem value="resolved">Resolved (Work Completed)</SelectItem>
                  <SelectItem value="rejected">Rejected (Not a civic defect)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Remarks
              </Label>
              <Textarea
                rows={3}
                required
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Pothole repaired successfully."
                className="text-sm rounded-xl border-slate-200 focus-visible:ring-emerald-500 resize-none"
              />
            </div>

            <Button
              type="button"
              onClick={handleResolve}
              disabled={submitting}
              className="w-full sm:w-auto h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-8 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Recording Resolution...
                </>
              ) : (
                "Mark as Resolved"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
