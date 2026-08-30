"use client";

import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, ArrowRight, Lock, Zap, CheckCircle, Eye } from "lucide-react";
import { playClick, resumeAudio } from "@/lib/sounds";
import { ScrollReveal } from "@/components/provenly/animations";

const MODULES = [
  { id: "transform", icon: "🤖", title: "Transformation AI", desc: "Transform any source — text, URL, voice, PPT, PDF — into LinkedIn, Twitter, advisories, presentations, infographics, and more.", color: "#3b82f6" },
  { id: "approval", icon: "✍️", title: "Multi-Sign Approval", desc: "Rigorous multi-signature approval chain with separation of duties before any publication.", color: "#10b981" },
  { id: "analysis", icon: "📊", title: "Analysis & Review", desc: "Consistency scoring, source grounding validation, quality metrics, and review dashboards.", color: "#06b6d4" },
  { id: "threat", icon: "🔍", title: "Threat Analysis", desc: "Advanced threat analysis engine scanning for misinformation and adversarial manipulation.", color: "#ef4444" },
  { id: "compliance", icon: "📋", title: "Compliance Check", desc: "Automated verification against DPDP Act, GDPR, IT Act, and organizational policies.", color: "#f59e0b" },
  { id: "dlp", icon: "🛡️", title: "DLP Scanner", desc: "Data Loss Prevention ensuring no classified or sensitive information leaks into content.", color: "#8b5cf6" },
  { id: "blockchain", icon: "⛓️", title: "Blockchain Verification", desc: "Every transformation gets a SHA-256 content hash recorded on a tamper-evident chain.", color: "#0ea5e9" },
  { id: "incident", icon: "🚨", title: "Incident Response", desc: "Structured incident response workflow with cascading order flow from senior leadership.", color: "#ec4899" },
];

const HIERARCHY = [
  { level: "Level 1", title: "Executive Leadership", roles: "Chairman, Distinguished Scientist", color: "#ec4899", icon: "🏛️" },
  { level: "Level 2", title: "Senior Management", roles: "Scientist G, F, E", color: "#f59e0b", icon: "👔" },
  { level: "Level 3", title: "Middle Management", roles: "Scientist D, C", color: "#3b82f6", icon: "📋" },
  { level: "Level 4", title: "General Scientists", roles: "All operational staff", color: "#10b981", icon: "🔬" },
];

const FEATURES = [
  { icon: <Lock className="w-5 h-5" />, title: "End-to-End Encryption", desc: "All content encrypted in transit and at rest" },
  { icon: <Zap className="w-5 h-5" />, title: "AI-Powered Pipeline", desc: "DLP scan → Threat analysis → Compliance → Transform" },
  { icon: <CheckCircle className="w-5 h-5" />, title: "Multi-Sign Approval", desc: "Separation of duties, no self-approval allowed" },
  { icon: <Eye className="w-5 h-5" />, title: "Full Audit Trail", desc: "Every action logged with blockchain verification" },
];

export default function LandingPage() {
  const router = useRouter();
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-blue-500 stroke-[1.8]" />
            <div>
              <span className="text-white text-lg font-semibold tracking-tight">NTRO GenAI</span>
              <span className="hidden sm:inline text-[10px] text-white/30 ml-2 tracking-widest uppercase">National Technical Research Organisation</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#modules"
              className="text-[13px] text-white/50 hover:text-white transition-colors hidden sm:block"
            >
              Features
            </a>
            <button
              onClick={() => { resumeAudio(); playClick(); router.push("/login"); }}
              className="px-5 py-2 text-[13px] font-medium bg-white text-[#0a0e1a] rounded-full hover:bg-white/90 transition-all duration-300"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative pt-32 pb-20 text-center overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-500/[0.04] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[12px] font-medium text-white/50 tracking-widest uppercase">Smart India Hackathon 2.0</span>
          </motion.div>

          <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-light leading-[1.1] tracking-tight text-white overflow-hidden">
            <motion.span
              className="block"
              initial={{ y: "110%" }}
              animate={heroInView ? { y: "0%" } : {}}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            >
              AI-Powered Content
            </motion.span>
            <motion.span
              className="block"
              initial={{ y: "110%" }}
              animate={heroInView ? { y: "0%" } : {}}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Transformation{" "}
              <span className="text-blue-400">Platform</span>
            </motion.span>
          </h1>

          <ScrollReveal delay={0.5} distance={20}>
            <p className="mt-6 text-base md:text-lg text-white/45 max-w-2xl mx-auto leading-relaxed font-light">
              A secure, auditable AI platform for transforming intelligence content into
              multiple communication formats with blockchain-verified provenance and
              multi-signature approval.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.65} distance={16}>
            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => { resumeAudio(); playClick(); router.push("/login"); }}
                className="group relative px-7 py-3 bg-blue-600 text-white text-sm font-medium rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/20"
              >
                <span className="relative z-10 flex items-center gap-2">Access Platform <ArrowRight className="w-4 h-4" /></span>
                <span className="absolute inset-0 bg-blue-700 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </button>
              <button
                onClick={() => { resumeAudio(); playClick(); router.push("/login"); }}
                className="px-7 py-3 border border-white/20 text-white/70 text-sm font-medium rounded-full hover:border-white/40 hover:text-white transition-all duration-300"
              >
                Secure Login
              </button>
            </div>
          </ScrollReveal>

          {/* Stats */}
          <ScrollReveal delay={0.8}>
            <div className="mt-16 flex justify-center gap-10 flex-wrap">
              {[
                { label: "Output Formats", value: "8+" },
                { label: "Security Layers", value: "7" },
                { label: "Approval Signatures", value: "Multi" },
                { label: "Verification", value: "SHA-256" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-light text-white tracking-tight">{s.value}</div>
                  <div className="text-[11px] text-white/35 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-y border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] text-blue-400 mb-3">
                {f.icon}
              </div>
              <h3 className="text-sm font-medium text-white/80 mb-1">{f.title}</h3>
              <p className="text-[12px] text-white/35 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Platform Modules */}
      <section id="modules" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-[clamp(1.8rem,3.5vw,2.5rem)] font-light leading-[1.15] tracking-tight text-white">
                Platform <span className="text-blue-400">Modules</span>
              </h2>
              <p className="mt-3 text-[14px] text-white/40">Eight integrated modules powering the complete content lifecycle</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULES.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                onClick={() => { resumeAudio(); playClick(); router.push("/login"); }}
                className="group p-6 bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60" style={{ background: `linear-gradient(90deg, ${m.color}, transparent)` }} />
                <div className="text-2xl mb-3">{m.icon}</div>
                <h3 className="text-sm font-semibold tracking-tight mb-2" style={{ color: m.color }}>{m.title}</h3>
                <p className="text-[12px] text-white/35 leading-relaxed">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hierarchy */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-[clamp(1.8rem,3.5vw,2.5rem)] font-light leading-[1.15] tracking-tight text-white">
                Security Access <span className="text-blue-400">Hierarchy</span>
              </h2>
              <p className="mt-3 text-[14px] text-white/40">Four-tier access control aligned with NTRO organizational structure</p>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {HIERARCHY.map((h, i) => (
              <motion.div
                key={h.level}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-center gap-4 p-5 bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${h.color}15` }}>
                  {h.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded" style={{ background: `${h.color}20`, color: h.color }}>
                      {h.level}
                    </span>
                    <h3 className="text-sm font-semibold text-white/90">{h.title}</h3>
                  </div>
                  <p className="text-[12px] text-white/35">{h.roles}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.5rem)] font-light leading-[1.15] tracking-tight text-white">
              Ready to transform your content workflow?
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => { resumeAudio(); playClick(); router.push("/login"); }}
                className="px-7 py-3 bg-white text-[#0a0e1a] text-sm font-medium rounded-full hover:bg-white/90 transition-all duration-300"
              >
                Get Started
              </button>
              <a href="https://github.com/shaurya-srv/genai-platform" target="_blank" rel="noopener noreferrer" className="px-7 py-3 border border-white/20 text-white/70 text-sm font-medium rounded-full hover:border-white/40 hover:text-white transition-all duration-300">
                View on GitHub
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500/60" />
            <span className="text-[12px] text-white/25">NTRO GenAI Platform &middot; Secure Content Transformation</span>
          </div>
          <span className="text-[11px] text-white/15">Blockchain & Cybersecurity &middot; Smart India Hackathon 2.0</span>
        </div>
      </footer>
    </div>
  );
}
