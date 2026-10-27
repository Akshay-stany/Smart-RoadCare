import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import RoadCareLogo from "@/components/common/RoadCareLogo";
import DeveloperCard from "@/components/common/DeveloperCard";
import Footer from "@/components/common/Footer";
import {
  Target,
  Eye,
  Camera,
  MapPin,
  Map,
  Activity,
  BellRing,
  Building2,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  Server,
  Database,
  Layers,
  Code2,
  Menu,
  X,
  User,
  LogIn,
} from "lucide-react";
import { useState } from "react";

export default function AboutPage() {
  const { user, role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (role === "admin") return "/admin";
    if (role === "officer") return "/officer";
    return "/dashboard";
  };

  // 7 Core Key Features
  const keyFeatures = [
    {
      title: "Citizen Complaint Reporting",
      desc: "Fast, user-friendly submission with photo upload, title, category tagging (pothole, road cracks, drainage), and urgency classification.",
      icon: Camera,
      color: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Accurate GPS Pinpointing",
      desc: "High-precision GPS tagging using browser geolocation with street address auto-reverse geocoding and manual map pin adjustments.",
      icon: MapPin,
      color: "from-blue-500 to-cyan-600",
      bgLight: "bg-blue-50 text-blue-700",
    },
    {
      title: "Live Interactive Road Map",
      desc: "Full GIS interactive map built with Leaflet and OpenStreetMap. Features dynamic marker clusters, status filtering, and traffic insights.",
      icon: Map,
      color: "from-sky-600 to-indigo-600",
      bgLight: "bg-sky-50 text-sky-700",
    },
    {
      title: "Real-Time Complaint Tracking",
      desc: "Full lifecycle status tracker from Pending to In Progress to Resolved, complete with transparent timestamps and repair history logs.",
      icon: Activity,
      color: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50 text-amber-700",
    },
    {
      title: "Instant In-App Notifications",
      desc: "Real-time notifications notify citizens when their complaints are reviewed, work crews assigned, or repairs completed.",
      icon: BellRing,
      color: "from-purple-500 to-pink-600",
      bgLight: "bg-purple-50 text-purple-700",
    },
    {
      title: "Municipal Admin Management",
      desc: "Centralized administrative control center to triage incoming reports, set priorities, assign field officers, and export analytics.",
      icon: Building2,
      color: "from-[#0F3C6C] to-slate-800",
      bgLight: "bg-slate-100 text-slate-800",
    },
    {
      title: "YOLO AI Road Damage Detection",
      desc: "Computer vision machine learning service powered by Python & YOLO to automatically detect and classify potholes and pavement cracks.",
      icon: Cpu,
      color: "from-teal-600 to-emerald-700",
      bgLight: "bg-teal-50 text-teal-800",
    },
  ];

  // Benefits for 3 core groups
  const benefits = [
    {
      group: "For Citizens",
      icon: Users,
      badge: "Empowering Residents",
      points: [
        "Report hazardous potholes in under 60 seconds directly from any smartphone.",
        "Transparent real-time tracking with unique Complaint IDs.",
        "Safer daily commutes and reduced vehicle damage costs.",
        "Direct communication channel with municipal highway authorities.",
      ],
      border: "border-emerald-200 bg-emerald-50/30",
      accent: "text-emerald-700",
    },
    {
      group: "For Administrators",
      icon: Building2,
      badge: "Municipal Highway Authority",
      points: [
        "Unified triage dashboard replacing fragmented paper complaints.",
        "Algorithmic prioritization based on traffic density and severity.",
        "Optimized field officer delegation and repair crew coordination.",
        "Verifiable repair completion audits with photographic records.",
      ],
      border: "border-sky-200 bg-sky-50/30",
      accent: "text-sky-800",
    },
    {
      group: "For Communities",
      icon: ShieldCheck,
      badge: "Public Safety & Urban Health",
      points: [
        "Significant reduction in road accidents and fatal road hazard collisions.",
        "Cleaner stormwater runoff by preventing blocked road drainage.",
        "Higher municipal accountability and trust in public infrastructure.",
        "Data-driven infrastructure planning for long-term road durability.",
      ],
      border: "border-purple-200 bg-purple-50/30",
      accent: "text-purple-700",
    },
  ];

  // Actual technologies used in the project
  const techStack = [
    {
      category: "Frontend & UI",
      icon: Layers,
      items: ["React 18", "Vite 8", "Tailwind CSS", "React Router v7", "Radix UI", "Lucide React", "Framer Motion", "Recharts"],
    },
    {
      category: "Mapping & GIS",
      icon: Map,
      items: ["Leaflet 1.9", "React-Leaflet 4", "OpenStreetMap", "Leaflet MarkerCluster", "HTML5 Geolocation API"],
    },
    {
      category: "Backend & Security",
      icon: Server,
      items: ["Node.js", "Express 4", "Zod Validation", "Helmet Security", "Express Rate Limit", "CORS Middleware"],
    },
    {
      category: "Database & Authentication",
      icon: Database,
      items: ["Supabase Cloud", "PostgreSQL", "Row Level Security (RLS)", "Supabase Auth (JWT)", "Realtime Database"],
    },
    {
      category: "AI & Computer Vision",
      icon: Cpu,
      items: ["Python 3", "YOLOv8 Model", "OpenCV", "Pothole & Crack Categorization", "Microservice REST API"],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Header / Navbar */}
      <header className="h-20 bg-white border-b border-slate-100 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
        <Link to="/" className="flex items-center">
          <RoadCareLogo size="md" theme="dark" subtext="CIVIC PORTAL" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className="text-slate-600 hover:text-slate-900 transition-colors">
            Home
          </Link>
          <Link to="/how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">
            How It Works
          </Link>
          <Link to="/map" className="text-slate-600 hover:text-slate-900 transition-colors">
            Live Road Map
          </Link>
          <Link
            to="/about"
            className="text-slate-900 font-semibold relative after:absolute after:-bottom-2.5 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-500"
          >
            About
          </Link>
        </nav>

        {/* Action Button */}
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
            className="block px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg"
          >
            About RoadCare
          </Link>
        </div>
      )}

      {/* 2. Project Introduction Hero */}
      <section className="bg-gradient-to-b from-white via-sky-50/20 to-slate-50 py-16 px-6 sm:px-12 border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/70 border border-sky-200 text-sky-800 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-700" />
            Civic Tech for Safer Communities
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            About RoadCare<span className="text-emerald-500">.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Smart Road Maintenance & Infrastructure Tracking Portal. Transforming every citizen into an active civic collaborator to eliminate road hazards and accelerate municipal road repairs.
          </p>
        </div>
      </section>

      {/* 3. Deep-Dive Overview, Mission & Vision */}
      <section className="max-w-6xl mx-auto px-6 sm:px-12 py-16 w-full space-y-12">
        {/* Project Introduction Paragraph */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            The RoadCare Civic Initiative
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Every year, thousands of road accidents and vehicle damages occur due to unaddressed potholes, neglected road cracks, and blocked drainage systems. Traditional municipal complaint processes are often slow, opaque, and cumbersome. <strong className="text-slate-900">RoadCare</strong> re-engineers this paradigm by providing an accessible, real-time web portal where citizens can snap a photo, capture precise GPS coordinates, and monitor municipal progress from submission through on-site resolution.
          </p>
        </div>

        {/* Mission & Vision Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mission Card */}
          <div className="rounded-3xl bg-white p-8 border border-slate-200/90 shadow-md shadow-slate-200/40 relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 shadow-2xs">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Our Mission</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              To bridge the gap between everyday commuters and municipal highway authorities through transparent civic technology — ensuring that every hazardous road defect is identified, prioritized, and permanently repaired with speed and accountability.
            </p>
          </div>

          {/* Vision Card */}
          <div className="rounded-3xl bg-white p-8 border border-slate-200/90 shadow-md shadow-slate-200/40 relative overflow-hidden group hover:border-sky-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-800 flex items-center justify-center mb-5 shadow-2xs">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Our Vision</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              A forward-thinking smart city landscape where AI computer vision, real-time civic participation, and intelligent municipal coordination eradicate road fatalities, create seamless transportation networks, and foster resilient urban infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Key Features Grid */}
      <section className="bg-white border-y border-slate-200 py-16 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Key Features of RoadCare
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Purpose-built tools designed to simplify reporting for citizens and empower field engineers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {keyFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-2xl border border-slate-200/80 p-6 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${feat.bgLight}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{feat.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Benefits Matrix (Citizens, Administrators, Communities) */}
      <section className="max-w-6xl mx-auto px-6 sm:px-12 py-16 w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-sky-800 uppercase tracking-widest block">
            Impact & Value
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Benefits for Everyone
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Delivering tangible improvements across civic engagement, administrative workflow, and community road safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.group}
                className={`rounded-3xl border-2 p-7 flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-1 ${b.border}`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-slate-800">
                      <Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{b.group}</h3>
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        {b.badge}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 pt-2">
                    {b.points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Technologies Actually Implemented */}
      <section className="bg-white border-y border-slate-200 py-16 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block">
              Engineering Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Actual Technologies Implemented
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Modern full-stack technologies powering the RoadCare portal and real-time processing engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech) => {
              const TechIcon = tech.icon;
              return (
                <div
                  key={tech.category}
                  className="rounded-2xl border border-slate-200/90 p-6 bg-slate-50/60 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-slate-700">
                        <TechIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">{tech.category}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {tech.items.map((it) => (
                        <span
                          key={it}
                          className="text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 shadow-3xs"
                        >
                          {it}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Meet the Developer Section (Bottom of About Page) */}
      <section className="max-w-4xl mx-auto px-6 sm:px-12 py-16 w-full">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block">
            The Vision Behind The Project
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Meet the Developer
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Designed, architected, and engineered to drive impactful civic road safety.
          </p>
        </div>

        {/* Developer Profile Card */}
        <DeveloperCard />
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
