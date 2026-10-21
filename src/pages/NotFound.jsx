import { Link } from "react-router-dom";
import RoadCareLogo from "@/components/common/RoadCareLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center font-sans">
      <div className="mb-6">
        <RoadCareLogo size="lg" theme="dark" subtext="404 — Page Not Found" />
      </div>
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-black">
          404
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Road Not Found</h1>
        <p className="text-sm text-slate-500 mb-6">
          The civic infrastructure page or destination you are navigating to does not exist or has been relocated.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link to="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/map" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Live Map
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

