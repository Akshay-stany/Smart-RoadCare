import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import RoadCareLogo from "@/components/common/RoadCareLogo";
import Footer from "@/components/common/Footer";
import {
  LogIn,
  Camera,
  MapPin,
  FileCheck2,
  UserCheck,
  Wrench,
  BellRing,
  CheckCircle2,
  ArrowRight,
  Compass,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Menu,
  X,
  LayoutDashboard,
  User,
} from "lucide-react";
import { useState } from "react";

export default function HowItWorksPage() {
  const { user, role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (role === "admin") return "/admin";
    if (role === "officer") return "/officer";
    return "/dashboard";
  };

  // Step-by-step 8-stage civic resolution workflow
  const steps = [
    {
      step: 1,
      title: "Citizen / Admin Login",
      shortTitle: "Secure Authentication",
      desc: "Citizens and municipal staff authenticate via dedicated secure portals. Citizens can sign in or create an instant account, while administrators and road engineers access priority management dashboards.",
      icon: LogIn,
      badge: "Step 01",
      accent: "from-blue-600 to-indigo-600",
      bgLight: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      step: 2,
      title: "Report Road Issues with Photos & Details",
      shortTitle: "Capture & Describe",
      desc: "Document the hazard with high-clarity photos. Categorize defect types including deep potholes, dangerous alligator road cracks, manhole hazards, or blocked stormwater drainage.",
      icon: Camera,
      badge: "Step 02",
      accent: "from-emerald-600 to-teal-600",
      bgLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      step: 3,
      title: "Add Precise GPS Location",
      shortTitle: "Pinpoint Coordinates",
      desc: "Leverage automatic browser geolocation or drag an interactive pin on the live Leaflet map to tag exact latitude and longitude coordinates and physical street addresses.",
      icon: MapPin,
      badge: "Step 03",
      accent: "from-cyan-600 to-blue-600",
      bgLight: "bg-cyan-50 text-cyan-700 border-cyan-200",
    },
    {
      step: 4,
      title: "Submit Complaint & Receive Unique ID",
      shortTitle: "Instant Ticket Generated",
      desc: "Upon submission, a unique civic tracking ticket (e.g. RC-1024) is generated instantly. The report enters the municipal queue with a verified timestamp and audit trail.",
      icon: FileCheck2,
      badge: "Step 04",
      accent: "from-amber-600 to-orange-600",
      bgLight: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      step: 5,
      title: "Admin Reviews & Assigns Repairs",
      shortTitle: "Municipal Triage",
      desc: "Municipal Highway Authority triage staff review the incident, evaluate urgency and severity (Low, Medium, High, Urgent), and delegate work orders to field maintenance teams.",
      icon: UserCheck,
      badge: "Step 05",
      accent: "from-[#0F3C6C] to-sky-700",
      bgLight: "bg-sky-50 text-sky-800 border-sky-200",
    },
    {
      step: 6,
      title: "Update Complaint Status & Field Action",
      shortTitle: "Asphalt Restoration",
      desc: "Assigned road maintenance crew dispatches to the site with repair machinery, sets safety perimeters, carries out asphalt patching or structural repairs, and logs field notes.",
      icon: Wrench,
      badge: "Step 06",
      accent: "from-orange-600 to-red-600",
      bgLight: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      step: 7,
      title: "Citizen Receives Live Notifications",
      shortTitle: "Real-Time Updates",
      desc: "The reporting citizen receives immediate notifications through their in-app notification center whenever their ticket transitions between triage, assignment, and repair stages.",
      icon: BellRing,
      badge: "Step 07",
      accent: "from-purple-600 to-pink-600",
      bgLight: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      step: 8,
      title: "Issue Resolved & Quality Verified",
      shortTitle: "Safe Roads Restored",
      desc: "Repair completion photos are uploaded, municipal audits verify structural safety, the ticket is officially closed as Resolved, and the live road map pin updates for public safety.",
      icon: CheckCircle2,
      badge: "Step 08",
      accent: "from-emerald-600 to-green-600",
      bgLight: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
  ];

  // Core status definitions requested by user
  const statuses = [
    {
      name: "Pending",
      colorName: "Yellow",
      badgeClass: "bg-amber-500 text-white",
      borderClass: "border-amber-300 bg-amber-50/50",
      textColor: "text-amber-800",
      accentIcon: Clock,
      definition: "Complaint logged and queued for administrative review",
      detail:
        "The road hazard has been submitted by a citizen and is currently awaiting triage by the Municipal Road Authority. During this phase, duplicate reports are clustered and initial priority is calculated.",
    },
    {
      name: "In Progress",
      colorName: "Red",
      badgeClass: "bg-red-600 text-white",
      borderClass: "border-red-300 bg-red-50/50",
      textColor: "text-red-800",
      accentIcon: AlertTriangle,
      definition: "Work crew dispatched and repair active on-site",
      detail:
        "An authorized field officer and road repair team have been assigned to the work order. Crew is mobilizing materials, setting traffic safety cones, and carrying out physical asphalt restoration.",
    },
    {
      name: "Resolved",
      colorName: "Green",
      badgeClass: "bg-emerald-600 text-white",
      borderClass: "border-emerald-300 bg-emerald-50/50",
      textColor: "text-emerald-800",
      accentIcon: CheckCircle2,
      definition: "Repair completed, verified, and safe passage restored",
      detail:
        "Field maintenance has patched the defect or cleared the hazard. Post-repair audit photos have been verified by municipal supervisors, the citizen is notified, and the live map status reflects a safe road.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Header / Navbar matching RoadCare theme */}
      <header className="h-20 bg-white border-b border-slate-100 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
        <Link to="/" className="flex items-center">
          <RoadCareLogo size="md" theme="dark" subtext="CIVIC PORTAL" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className="text-slate-600 hover:text-slate-900 transition-colors">
            Home
          </Link>
          <Link
            to="/how-it-works"
            className="text-slate-900 font-semibold relative after:absolute after:-bottom-2.5 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-500"
          >
            How It Works
          </Link>
          <Link to="/map" className="text-slate-600 hover:text-slate-900 transition-colors">
            Live Road Map
          </Link>
          <Link to="/about" className="text-slate-600 hover:text-slate-900 transition-colors">
            About
          </Link>
        </nav>

        {/* Header Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-500 text-xs font-semibold"
          >
            <Link to="/map">
              <Compass className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Live Map
            </Link>
          </Button>

          {user ? (
            <Button
              asChild
              className="bg-[#059669] hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 h-10 text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Link to={getDashboardLink()}>
                <User className="w-3.5 h-3.5" /> Dashboard
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              className="bg-[#059669] hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 h-10 text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Link to="/auth?portal=citizen">
                <LogIn className="w-3.5 h-3.5" /> Sign In
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
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Home
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg"
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
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
            >
              Report a Road Issue
            </Link>
          </div>
        </div>
      )}

      {/* 2. Hero Section */}
      <section className="bg-gradient-to-b from-white via-emerald-50/20 to-slate-50 py-16 px-6 sm:px-12 border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Civic Workflow & Infrastructure Pipeline
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            How RoadCare Works<span className="text-emerald-500">.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From discovering a dangerous pothole to complete road surface restoration — discover the complete 8-step journey connecting citizens directly with municipal highway engineers.
          </p>

          {/* Action Buttons connected directly to features */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-6 h-12 shadow-sm transition-all"
            >
              <Link to="/report" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Report a Road Issue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-6 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
            >
              <Link to="/map" className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                View Live Road Map
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Step-by-Step Workflow Timeline */}
      <section className="max-w-6xl mx-auto px-6 sm:px-12 py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block">
            End-to-End Resolution Journey
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            8-Step Infrastructure Maintenance Cycle
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A seamless, traceable path that ensures citizen complaints never get lost in bureaucracy.
          </p>
        </div>

        {/* Timeline Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md shadow-slate-200/40 flex flex-col justify-between relative group hover:border-emerald-300 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                {/* Number Badge & Icon Header */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${item.bgLight}`}>
                      {item.badge}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 flex items-center justify-center transition-colors shadow-2xs border border-slate-100">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 group-hover:text-emerald-800 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                {/* Card Footer indicator */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-emerald-600 transition-colors">
                  <span>{item.shortTitle}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Complaint Status Explanation Section (Pending / In Progress / Resolved) */}
      <section className="bg-white border-y border-slate-200 py-16 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block">
              Complaint Status Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Understanding Road Issue Statuses
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Each reported issue progresses through standardized state transitions clearly visible on citizen dashboards and the public map.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statuses.map((stat) => {
              const StatIcon = stat.accentIcon;
              return (
                <div
                  key={stat.name}
                  className={`rounded-3xl border-2 p-6 sm:p-7 flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-1 ${stat.borderClass}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide shadow-xs ${stat.badgeClass}`}>
                        {stat.name} ({stat.colorName})
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-2xs">
                        <StatIcon className="w-4 h-4 text-slate-700" />
                      </div>
                    </div>

                    <div>
                      <h4 className={`text-lg font-bold ${stat.textColor}`}>
                        {stat.definition}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-2.5 font-normal">
                        {stat.detail}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Live Tracking Enabled</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Interactive Call-to-Action with Working Buttons */}
      <section className="max-w-5xl mx-auto px-6 sm:px-12 py-16 w-full">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#0F3C6C] to-emerald-800 p-8 sm:p-12 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden">
          <div className="space-y-3 max-w-xl z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Take Civic Action Today
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              Notice a dangerous pothole or road defect in your area?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Submit a report in under 60 seconds with exact GPS coordinates and photo evidence to notify municipal repair authorities directly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto z-10">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl px-6 h-12 shadow-md shadow-emerald-950/20"
            >
              <Link to="/report" className="flex items-center justify-center gap-2">
                <Camera className="w-4 h-4" />
                Report a Road Issue
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold rounded-xl px-5 h-12 backdrop-blur-md"
            >
              <Link to="/map" className="flex items-center justify-center gap-2">
                <Compass className="w-4 h-4 text-emerald-300" />
                View Live Road Map
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
