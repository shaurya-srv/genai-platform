"use client";

import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, ArrowRight } from "lucide-react";
import { playClick, resumeAudio } from "@/lib/sounds";
import { ScrollReveal } from "@/components/provenly/animations";

const MODULES = [
  { id: "transform", icon: "🤖", title: "Transformation AI", desc: "Transform any source — text, URL, voice, PPT, PDF — into LinkedIn, Twitter, advisories, presentations, infographics, and more.", color: "#C8442C" },
  { id: "approval", icon: "✍️", title: "Multi-Sign Approval", desc: "Rigorous multi-signature approval chain with separation of duties before any publication.", color: "#8ED7A3" },
  { id: "analysis", icon: "📊", title: "Analysis & Review", desc: "Consistency scoring, source grounding validation, quality metrics, and review dashboards.", color: "#4DB8C7" },
  { id: "threat", icon: "🔍", title: "Threat Analysis", desc: "Advanced threat analysis engine scanning for misinformation and adversarial manipulation.", color: "#D4654A" },
  { id: "compliance", icon: "📋", title: "Compliance Check", desc: "Automated verification against DPDP Act, GDPR, IT Act, and organizational policies.", color: "#C8442C" },
  { id: "dlp", icon: "🛡️", title: "DLP Scanner", desc: "Data Loss Prevention ensuring no classified or sensitive information leaks into content.", color: "#8B6CC7" },
  { id: "blockchain", icon: "⛓️", title: "Blockchain Verification", desc: "Every transformation gets a SHA-256 content hash recorded on a tamper-evident chain.", color: "#8ED7A3" },
  { id: "incident", icon: "🚨", title: "Incident Response", desc: "Structured incident response workflow with cascading order flow from senior leadership.", color: "#D4654A" },
];

const HIERARCHY = [
  { level: "Level 1", title: "Executive Leadership", roles: "Chairman, Distinguished Scientist", color: "#C8442C", icon: "🏛️" },
  { level: "Level 2", title: "Senior Management", roles: "Scientist G, F, E", color: "#D4654A", icon: "👔" },
  { level: "Level 3", title: "Middle Management", roles: "Scientist D, C", color: "#4DB8C7", icon: "📋" },
  { level: "Level 4", title: "General Scientists", roles: "All operational staff", color: "#8ED7A3", icon: "🔬" },
];

export default function LandingPage() {
  const router = useRouter();
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#121212]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-[#C8442C] stroke-[1.8]" />
            <span className="text-white text-lg font-semibold tracking-tight">NTRO GenAI</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="#modules" className="text-[13px] text-white/50 hover:text-white transition-colors hidden md:block">
              Features
            </a>
            <a href="#hierarchy" className="text-[13px] text-white/50 hover:text-white transition-colors hidden md:block">
              Access
            </a>
            <button
              onClick={() => { resumeAudio(); playClick(); router.push("/login"); }}
              className="px-5 py-2 text-[13px] font-medium bg-white text-[#121212] rounded-full hover:bg-white/90 transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="home" ref={heroRef} className="relative pt-32 pb-20 overflow-hidden">
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full">
            <defs>
              <pattern id="heroGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heroGrid)" />
          </svg>
        </div>
        {/* Radial glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={heroInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 2 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#C8442C]/[0.03] rounded-full blur-[120px] pointer-events-none"
        />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8ED7A3] animate-pulse" />
            <span className="text-[12px] font-medium text-white/50 tracking-widest uppercase">Smart India Hackathon 2.0</span>
          </motion.div>

          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[1.08] tracking-tight text-white max-w-4xl mx-auto overflow-hidden">
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
              <span className="text-[#8ED7A3]">Platform</span>
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
                className="group relative px-7 py-3 bg-[#C8442C] text-white text-sm font-medium rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#C8442C]/20"
              >
                <span className="relative z-10 flex items-center gap-2">Access Platform <ArrowRight className="w-4 h-4" /></span>
                <span className="absolute inset-0 bg-[#B83A24] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </button>
              <button
                onClick={() => { resumeAudio(); playClick(); router.push("/login"); }}
                className="px-7 py-3 border border-white/20 text-white/80 text-sm font-medium rounded-full hover:border-white/40 hover:text-white transition-all duration-300"
              >
                Secure Login
              </button>
            </div>
          </ScrollReveal>

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

      {/* Modules */}
      <section id="modules" className="py-28 border-t border-white/[0.04]">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <ScrollReveal>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-[#C8442C] stroke-[1.8]" />
                <span className="text-[11px] font-semibold text-[#C8442C] tracking-widest uppercase">Modules</span>
              </div>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.12] tracking-tight text-white">
                Platform <span className="text-[#8ED7A3]">Modules</span>
              </h2>
              <p className="mt-4 text-[15px] text-white/40 max-w-lg mx-auto font-light">
                Eight integrated modules powering the complete content lifecycle
              </p>
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
                className="group relative bg-white/[0.04] border border-white/[0.06] p-6 hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/[0.1]" />
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-[10px] font-semibold text-white/35 tracking-widest uppercase">
                    {m.id}
                  </span>
                </div>
                <div className="text-2xl mb-3 opacity-70 group-hover:opacity-100 transition-opacity">{m.icon}</div>
                <h3 className="text-base font-normal text-white tracking-tight mb-2">{m.title}</h3>
                <div className="w-8 h-px bg-white/[0.08] mb-3" />
                <p className="text-[13px] text-white/40 leading-relaxed font-light">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hierarchy */}
      <section id="hierarchy" className="py-28 border-t border-white/[0.04]">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <ScrollReveal>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-[#C8442C] stroke-[1.8]" />
                <span className="text-[11px] font-semibold text-[#C8442C] tracking-widest uppercase">Security</span>
              </div>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.12] tracking-tight text-white">
                Access <span className="text-[#8ED7A3]">Hierarchy</span>
              </h2>
              <p className="mt-4 text-[15px] text-white/40 max-w-lg mx-auto font-light">
                Four-tier access control aligned with NTRO organizational structure
              </p>
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
                className="flex items-center gap-5 p-6 bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${h.color}12` }}>
                  {h.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded" style={{ background: `${h.color}20`, color: h.color }}>
                      {h.level}
                    </span>
                    <h3 className="text-[15px] font-normal text-white tracking-tight">{h.title}</h3>
                  </div>
                  <p className="text-[13px] text-white/35 font-light">{h.roles}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#C8442C] relative overflow-hidden">
        <div className="relative z-10 max-w-[1320px] mx-auto px-6 lg:px-10 py-24 md:py-32 text-center">
          <ScrollReveal>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-light leading-[1.15] tracking-tight text-white max-w-2xl mx-auto">
              Ready to secure your content workflow?
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => { resumeAudio(); playClick(); router.push("/login"); }}
                className="px-7 py-3 bg-white text-[#C8442C] text-sm font-medium rounded-full hover:bg-white/90 transition-all duration-300"
              >
                Get Started
              </button>
              <a href="https://github.com/shaurya-srv/genai-platform" target="_blank" rel="noopener noreferrer" className="px-7 py-3 bg-[#121212] text-white text-sm font-medium rounded-full hover:bg-[#1A1A1A] transition-all duration-300">
                View on GitHub
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#121212] relative overflow-hidden">
        <div className="flex flex-col items-center gap-1.5 pt-8 pb-6">
          <div className="w-20 h-px bg-[#C8442C]/60" />
          <div className="w-14 h-px bg-[#C8442C]/40" />
          <div className="w-10 h-px bg-[#C8442C]/25" />
        </div>
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 pb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.05] pt-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#C8442C] stroke-[1.8]" />
              <span className="text-[12px] text-white/30 font-light">NTRO GenAI Platform &middot; Secure Content Transformation</span>
            </div>
            <span className="text-[11px] text-white/15">Blockchain & Cybersecurity &middot; Smart India Hackathon 2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
