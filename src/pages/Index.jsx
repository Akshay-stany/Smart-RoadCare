import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import RoadCareLogo from "@/components/common/RoadCareLogo";
import MapView from "@/components/MapView";
import DeveloperCard from "@/components/common/DeveloperCard";
import Footer from "@/components/common/Footer";
import {
  ArrowRight,
  User,
  Building2,
  PenTool,
  MapPin,
  Bell,
  Users,
  FileText,
  Settings,
  BarChart3,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Menu,
  X,
  Target,
  Eye,
  LogIn,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function Index() {
  const { user, role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (role === "admin") return "/admin";
    if (role === "officer") return "/officer";
    return "/dashboard";
  };

  // 8 Workflow steps for the How It Works overview
  const workflowSteps = [
    { num: "01", title: "Citizen/Admin Login", desc: "Dual portal access with instant citizen sign-in and administrative oversight dashboards." },
    { num: "02", title: "Report Road Issues", desc: "Attach photos, descriptions, and tag defect types (potholes, cracks, drainage)." },
    { num: "03", title: "Add GPS Location", desc: "Auto-fetch browser coordinates or pinpoint exact physical street location on the map." },
    { num: "04", title: "Submit & Get Ticket ID", desc: "Instantly receive a verifiable complaint tracking ID (e.g. RC-1024) with audit log." },
    { num: "05", title: "Admin Reviews & Assigns", desc: "Municipal engineers triage report, evaluate urgency, and dispatch repair crews." },
    { num: "06", title: "Update Complaint Status", desc: "On-site road maintenance crew logs asphalt patching and repair progress." },
    { num: "07", title: "Citizen Notifications", desc: "Instant notifications sent to reporting citizen at each state transition." },
    { num: "08", title: "Issue Resolved", desc: "Repair verified with audit photo, ticket closed, and safe road restored." },
  ];

  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Top Navbar matching generated design */}
      <header className="h-20 bg-white border-b border-slate-100 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
        <Link to="/" className="flex items-center">
          <RoadCareLogo size="md" theme="dark" subtext="CIVIC PORTAL" />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            to="/"
            className="text-slate-900 font-semibold relative after:absolute after:-bottom-2.5 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-500"
          >
            Home
          </Link>
          <Link to="/how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">
            How It Works
          </Link>
          <Link to="/map" className="text-slate-600 hover:text-slate-900 transition-colors">
            Live Road Map
          </Link>
          <Link to="/about" className="text-slate-600 hover:text-slate-900 transition-colors">
            About
          </Link>
        </nav>

        {/* Action Button */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <Button
              asChild
              className="bg-[#059669] hover:bg-emerald-700 text-white font-semibold rounded-xl px-5 h-10 flex items-center gap-2 shadow-xs transition-colors"
            >
              <Link to={getDashboardLink()}>
                <User className="w-4 h-4" /> Go to Dashboard
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              className="bg-[#059669] hover:bg-emerald-700 text-white font-semibold rounded-xl px-5 h-10 flex items-center gap-2 shadow-xs transition-colors"
            >
              <Link to="/auth?portal=citizen">
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-5 space-y-3 shadow-lg">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg"
          >
            Home
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            How It Works
          </Link>
          <Link
            to="/map"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Live Road Map
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            About RoadCare
          </Link>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to={user ? getDashboardLink() : "/auth?portal=citizen"}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
            >
              {user ? "Go to Dashboard" : "Sign In to Portal"}
            </Link>
          </div>
        </div>
      )}

      {/* 2. Hero Section with Mountain Highway Landscape Background on Right */}
      <section className="relative overflow-hidden pt-10 pb-16 px-6 sm:px-12 flex-1 flex flex-col justify-center">
        {/* Landscape Road Banner Image positioned on the right */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 pointer-events-none overflow-hidden -z-10">
          <img
            src="/images/road-login-hero.jpg"
            alt="Scenic Mountain Road"
            className="w-full h-full object-cover object-right opacity-90 lg:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/70 to-transparent hidden lg:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/40 to-transparent lg:hidden" />
        </div>

        <div className="max-w-7xl mx-auto w-full">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-4 backdrop-blur-xs">
            <RoadCareLogo size="sm" showText={false} className="w-4 h-4" />
            Civic Infrastructure Management
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-slate-900 leading-[1.12]">
            Better Roads.
            <br />
            Brighter Communities<span className="text-emerald-500">.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-3 text-base sm:text-lg text-slate-600 font-medium max-w-xl">
            Report road issues, track repairs, and help build safer streets.
          </p>

          {/* Two Separate Portal Cards: Citizen and Admin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8 max-w-2xl">
            {/* Citizen Portal Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xl shadow-slate-200/60 flex flex-col justify-between transition-transform hover:-translate-y-0.5">
              <div>
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Citizen Portal</h2>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed min-h-[32px]">
                  Report potholes, track your complaints, and receive repair updates.
                </p>

                {/* Continue as Citizen Button */}
                <Button
                  asChild
                  className="w-full h-11 bg-[#059669] hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all mt-4 mb-5 flex items-center justify-center gap-2 shadow-xs group"
                >
                  <Link to="/auth?portal=citizen">
                    Continue as Citizen
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>

                {/* Features List */}
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium pt-1">
                  <li className="flex items-center gap-2.5">
                    <PenTool className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Report road issues with photos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Track your complaints in real-time</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Bell className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Receive status updates</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Help build safer communities</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Admin Portal Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xl shadow-slate-200/60 flex flex-col justify-between transition-transform hover:-translate-y-0.5">
              <div>
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-800 flex items-center justify-center shrink-0 shadow-2xs">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Admin Portal</h2>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed min-h-[32px]">
                  Review reports, manage priorities, assign repairs, and monitor progress.
                </p>

                {/* Continue as Admin Button */}
                <Button
                  asChild
                  className="w-full h-11 bg-[#0F3C6C] hover:bg-[#0c2f55] text-white font-semibold rounded-xl text-sm transition-all mt-4 mb-5 flex items-center justify-center gap-2 shadow-xs group"
                >
                  <Link to="/auth?portal=admin">
                    Continue as Admin
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>

                {/* Features List */}
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium pt-1">
                  <li className="flex items-center gap-2.5">
                    <FileText className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                    <span>View and manage citizen reports</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Settings className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                    <span>Set priorities and assign repairs</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <BarChart3 className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                    <span>Track progress and analytics</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Users className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                    <span>Coordinate with field teams</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3. Live Road Issue Map Preview Section */}
          <div className="mt-12 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Column: Heading and CTA */}
            <div className="lg:col-span-3 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Live Road Issue Map
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Explore reported road issues across your city in real-time.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-1 h-9 rounded-xl border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-500 text-xs font-semibold flex items-center gap-1.5"
              >
                <Link to="/map">
                  View Live Map <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>

            {/* Center Column: Live Map Container */}
            <div className="lg:col-span-6">
              <div className="h-44 sm:h-52 w-full rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                <MapView
                  center={[13.01, 77.59]}
                  zoom={11}
                  interactive={true}
                  showTrafficDefault={false}
                  className="h-full w-full"
                />
              </div>
            </div>

            {/* Right Column: Status Legend */}
            <div className="lg:col-span-3 space-y-3 lg:pl-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Road Issue Status
              </span>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                    !
                  </span>
                  <div>
                    <div className="font-semibold text-slate-800 text-xs leading-none">Pending (Yellow)</div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Reported and under review
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                    !
                  </span>
                  <div>
                    <div className="font-semibold text-slate-800 text-xs leading-none">In Progress (Red)</div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Work crew assigned & active
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                    ✓
                  </span>
                  <div>
                    <div className="font-semibold text-slate-800 text-xs leading-none">Resolved (Green)</div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Issue verified & fixed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Embedded How It Works Section (anchor id="how-it-works") */}
      <section id="how-it-works" className="py-20 px-6 sm:px-12 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-100">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Transparent Resolution Journey
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                How RoadCare Works
              </h2>
              <p className="text-sm text-slate-500 max-w-xl">
                A simple, systematic 8-stage pipeline connecting citizen hazard alerts with municipal highway repair teams.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs h-10 shadow-xs">
                <Link to="/how-it-works" className="flex items-center gap-1.5">
                  <span>Explore Full Workflow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* 8-Step Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflowSteps.map((ws) => (
              <div
                key={ws.num}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-emerald-300 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Step {ws.num}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-3 mb-1.5">
                    {ws.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {ws.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Working Action Buttons */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-base font-bold text-slate-900">Ready to report a defect or inspect repairs?</h3>
              <p className="text-xs text-slate-600">Immediate direct access to complaint forms and live geographic monitoring.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs h-10 shadow-xs">
                <Link to="/report" className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  Report a Road Issue
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold rounded-xl text-xs h-10 shadow-2xs">
                <Link to="/map" className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  View Live Road Map
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Embedded About Section (anchor id="about") */}
      <section id="about" className="py-20 px-6 sm:px-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-200/80">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                Civic Mission & Engineering
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                About RoadCare
              </h2>
              <p className="text-sm text-slate-500 max-w-xl">
                Smart Road Maintenance & Infrastructure Tracking Portal dedicated to eliminating road hazards.
              </p>
            </div>
            <Button asChild variant="outline" className="border-slate-300 text-slate-700 rounded-xl text-xs h-10 font-semibold bg-white hover:bg-slate-50 shadow-2xs">
              <Link to="/about" className="flex items-center gap-1.5">
                <span>View Full About Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          {/* Mission & Vision Mini Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Our Mission</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                To modernize municipal road maintenance through transparent civic technology, ensuring dangerous potholes and structural cracks are documented in under 60 seconds and permanently repaired.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Our Vision</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                A connected smart city landscape where AI computer vision, real-time citizen participation, and automated work orders ensure zero road fatalities and durable public transportation arteries.
              </p>
            </div>
          </div>

          {/* Meet the Developer Component Embedded */}
          <div className="pt-4">
            <div className="text-center max-w-xl mx-auto mb-8 space-y-1.5">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">
                Project Developer
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900">Meet the Developer</h3>
            </div>
            <DeveloperCard />
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <Footer />
    </div>
  );
}
