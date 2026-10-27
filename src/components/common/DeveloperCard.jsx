import { Github, Linkedin, ExternalLink, Code2, Sparkles, MapPin, CheckCircle2, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DeveloperCard() {
  const technologies = [
    { name: "React 18", category: "frontend", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    { name: "Vite", category: "frontend", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { name: "Tailwind CSS", category: "styling", color: "bg-sky-50 text-sky-700 border-sky-200" },
    { name: "Leaflet & GIS", category: "gis", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "Node.js & Express", category: "backend", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    { name: "Supabase & PostgreSQL", category: "database", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "Python & YOLO AI", category: "ai", color: "bg-amber-50 text-amber-800 border-amber-200" },
    { name: "Computer Vision", category: "ai", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { name: "REST APIs & RLS", category: "security", color: "bg-slate-100 text-slate-800 border-slate-300" },
  ];

  return (
    <div id="developer" className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-10 transition-all">
      {/* Top Background Gradient Banner */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-[#0F3C6C] via-teal-700 to-emerald-600 opacity-95" />

      <div className="relative pt-12 sm:pt-14">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            {/* Developer Profile Image Placeholder / Verified Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1.5 shadow-xl ring-4 ring-white/80">
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-slate-900 via-[#0F3C6C] to-emerald-600 flex flex-col items-center justify-center text-white font-black text-2xl sm:text-3xl tracking-tight shadow-inner relative overflow-hidden">
                  {/* Subtle code pattern backdrop */}
                  <span className="select-none">SKS</span>
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/60 py-0.5 text-[9px] font-bold tracking-widest text-emerald-300 uppercase text-center">
                    Dev
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-sm" title="Verified Creator">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Developer Info */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Project Developer
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Sooraj K S
              </h3>
              <p className="text-sm font-medium text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-600" />
                Full-Stack Developer & Civic Technology Enthusiast
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-10 px-4 rounded-xl border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold shadow-2xs"
            >
              <a
                href="https://github.com/soorajsoorajks"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </Button>

            <Button
              asChild
              size="sm"
              className="h-10 px-4 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white font-semibold shadow-xs"
            >
              <a
                href="https://www.linkedin.com/in/sooraj-k-s-930507304?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3 text-white/80" />
              </a>
            </Button>
          </div>
        </div>

        {/* Bio Narrative */}
        <div className="pt-6 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            Passionate software developer focused on designing and building impactful civic tech solutions, smart municipal monitoring platforms, and data-driven infrastructure systems. Built <strong className="text-slate-900 font-semibold">RoadCare</strong> as an end-to-end civic ecosystem that empowers regular citizens to actively safeguard their communities, streamlines municipal road inspections, and brings real-time accountability to public infrastructure maintenance.
          </p>
        </div>

        {/* Technology Badges */}
        <div className="pt-6">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
            Core Technologies & Project Architecture
          </span>
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <span
                key={tech.name}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shadow-2xs transition-transform hover:-translate-y-0.5 ${tech.color}`}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
