import { useNavigate } from "react-router-dom";
import ReportForm from "@/components/ReportForm";

export default function ReportPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-2xl font-bold text-foreground mb-1">Report a Road Issue</h1>
      <p className="text-muted-foreground mb-6 text-sm">Help us improve our roads by reporting potholes, damaged infrastructure, and other issues.</p>
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <ReportForm onSuccess={() => navigate("/dashboard")} />
      </div>
    </div>
  );
}
