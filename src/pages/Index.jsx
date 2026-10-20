import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import StatsCards from "@/components/StatsCards";
import { MapPin, ArrowRight, Shield, Eye, Zap } from "lucide-react";
import { motion } from "framer-motion";
export default function Index() {
    const { user } = useAuth();
    return (<div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(220_60%_30%),transparent_60%)]"/>
        <div className="container relative mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
              <MapPin className="h-8 w-8 text-accent-foreground"/>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground tracking-tight mb-4">
              Report. Track. Resolve.
            </h1>
            <p className="mx-auto max-w-xl text-lg text-primary-foreground/80 mb-8">
              RoadCare empowers citizens to report road issues and helps authorities resolve them faster. Together, we build safer roads.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to={user ? "/report" : "/auth"}>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8">
                  Report an Issue <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              </Link>
              <Link to="/map">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  View Map
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto -mt-8 relative z-10 px-4">
        <StatsCards />
      </section>

      {/* Features */}
      <section className="container mx-auto py-20 px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Eye, title: "Spot & Report", desc: "See a pothole, broken light, or damaged road? Report it instantly with photos and location." },
            { icon: Shield, title: "Track Progress", desc: "Get real-time updates as authorities review and resolve your reported issues." },
            { icon: Zap, title: "Faster Fixes", desc: "Authorities prioritize and manage issues efficiently with our smart dashboard." },
        ].map((f, i) => (<motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }} className="rounded-xl border bg-card p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-6 w-6 text-primary"/>
              </div>
              <h3 className="mb-2 font-semibold text-lg text-card-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>))}
        </div>
      </section>
    </div>);
}
