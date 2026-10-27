import { Link } from "react-router-dom";
import RoadCareLogo from "@/components/common/RoadCareLogo";
import { ShieldCheck, Heart, Github, Linkedin, MapPin, ExternalLink, ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <RoadCareLogo size="md" theme="light" subtext="CIVIC PORTAL" />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Smart Road Maintenance & Infrastructure Tracking Portal. Empowering citizens and municipal authorities with real-time hazard reporting, GIS live mapping, and transparent repair workflows.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Civic Infrastructure Platform Operational</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-emerald-400 transition-colors">
                  Live Road Map
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-400 transition-colors">
                  About RoadCare
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals & Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Civic Portals</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/auth?portal=citizen" className="hover:text-emerald-400 transition-colors">
                  Citizen Portal
                </Link>
              </li>
              <li>
                <Link to="/auth?portal=admin" className="hover:text-emerald-400 transition-colors">
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  Report a Road Issue
                </Link>
              </li>
              <li>
                <Link to="/live-detection" className="hover:text-emerald-400 transition-colors">
                  AI Damage Detection
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Developer</h4>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <div className="font-semibold text-white">Sooraj K S</div>
              <p className="text-slate-400 text-[11px]">
                Project Developer & Full-Stack Civic Tech Engineer.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="https://github.com/soorajsoorajks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/sooraj-k-s-930507304?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-sky-400 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <Link
                  to="/about#developer"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] ml-auto flex items-center gap-0.5"
                >
                  Profile <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} RoadCare — Civic Infrastructure & Road Damage Resolution. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Public Service Infrastructure
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
