import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import RoadCareLogo from "@/components/common/RoadCareLogo";
import {
  Sparkles,
  ArrowRight,
  Cpu,
  Activity,
  Users,
  ShieldCheck,
  MapPin,
  Clock,
  Camera,
  CheckCircle,
} from "lucide-react";

export default function Index() {
  const { user, role } = useAuth();

  const getDashboardLink = () => {
    if (role === "admin") return "/admin";
    if (role === "officer") return "/officer";
    return "/dashboard";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Top Navbar */}
      <header className="h-20 border-b border-slate-100 px-6 sm:px-12 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-40">
        <Link to="/" className="flex items-center">
          <RoadCareLogo size="md" theme="dark" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link to="/" className="text-emerald-600 font-semibold hover:text-emerald-700">
            Home
          </Link>
          <Link to="/report" className="hover:text-slate-900 transition-colors">
            Report
          </Link>
          <Link to="/map" className="hover:text-slate-900 transition-colors">
            Track
          </Link>
          <a href="#features" className="hover:text-slate-900 transition-colors">
            About
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg px-5 shadow-sm"
            >
              <Link to={getDashboardLink()}>Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="text-slate-700 hover:text-slate-900 text-sm font-medium"
              >
                <Link to="/auth">Login</Link>
              </Button>
              <Button
                asChild
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg px-5 shadow-sm"
              >
                <Link to="/auth?tab=signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-24 px-6 sm:px-12 max-w-6xl mx-auto text-center flex-1 flex flex-col justify-center items-center">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-100/40 blur-3xl -z-10 rounded-full pointer-events-none" />

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Smart Roads, Safer Communities
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] max-w-4xl text-balance">
          Report Road Issues <br className="hidden sm:inline" />
          Build A Safer <span className="text-emerald-600">Tomorrow</span>
        </h1>

        {/* Helper Subtext */}
        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed text-balance">
          A smart platform to report potholes, road damage, and infrastructure
          issues using AI and real-time location. Together we can build cleaner,
          safer and better roads.
        </p>

        {/* CTA Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 h-12 rounded-xl text-base shadow-md shadow-emerald-600/20 group"
          >
            <Link to="/report" className="flex items-center gap-2">
              Report a Road Issue
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-6 h-12 rounded-xl text-base"
          >
            <Link to="/map">View Live Map</Link>
          </Button>
        </div>

        {/* 3 Highlight Cards matching bottom of Screen 1 */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <Cpu className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                AI Powered Detection
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Automatically detect potholes and road-damage from images.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Real-time Tracking
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Track complaint status live with GPS precision.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Community Impact
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Safer roads for everyone through municipal accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Workflow section */}
      <section id="features" className="py-20 bg-slate-50/70 border-t border-slate-200/80 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Civic Infrastructure Lifecycle
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
              From Report to Resolution
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              Transparent, accountable municipal workflow with automated dispatch and AI inspection.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-base">Report & Detect</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Capture photo and GPS coordinate. AI identifies defect type and severity.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-base">Triage & Assign</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Admin verifies the defect and dispatches to the responsible maintenance officer.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-base">Field Maintenance</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Officers repair the damage and upload completion photos for before/after comparison.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm mb-4">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-base">Verified & Closed</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Citizen receives real-time notification, confirms quality, and closes the case.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white px-6 sm:px-12 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <RoadCareLogo size="sm" theme="dark" subtext="Civic Infrastructure" />
          <p>© {new Date().getFullYear()} RoadCare. Real-time civic infrastructure workflow.</p>
          <div className="flex items-center gap-6">
            <Link to="/auth" className="hover:text-slate-900">
              Sign In
            </Link>
            <Link to="/map" className="hover:text-slate-900">
              Live Map
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
