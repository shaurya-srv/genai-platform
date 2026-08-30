import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield } from "lucide-react";
import { playHover, playClick, resumeAudio } from "@/lib/sounds";
import { ScrollReveal, TextReveal, StaggerChildren, staggerItem, LineReveal } from "./animations";

const services = [
  {
    title: "Detection",
    category: "Core Capability",
    color: "#C8442C",
    desc: "Real-time threat identification using behavioral analysis and anomaly detection across all network layers.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="#C8442C" strokeWidth="1">
        <circle cx="24" cy="24" r="18" strokeDasharray="3 3" />
        <circle cx="24" cy="24" r="8" />
        <line x1="24" y1="6" x2="24" y2="16" />
        <line x1="24" y1="32" x2="24" y2="42" />
        <line x1="6" y1="24" x2="16" y2="24" />
        <line x1="32" y1="24" x2="42" y2="24" />
      </svg>
    ),
  },
  {
    title: "Analysis",
    category: "Intelligence",
    color: "#4DB8C7",
    desc: "Deep forensic analysis of attack vectors, threat actors, and vulnerability patterns with AI-generated insights.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="#4DB8C7" strokeWidth="1">
        <rect x="6" y="6" width="36" height="36" rx="2" strokeDasharray="3 3" />
        <polyline points="10,34 18,22 26,28 34,14 40,18" />
        <circle cx="18" cy="22" r="2" fill="#4DB8C7" />
        <circle cx="26" cy="28" r="2" fill="#4DB8C7" />
        <circle cx="34" cy="14" r="2" fill="#4DB8C7" />
      </svg>
    ),
  },
  {
    title: "Prevention",
    category: "Defense",
    color: "#D4654A",
    desc: "Automated containment and blocking of malicious traffic, payloads, and unauthorized access attempts in real time.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="#D4654A" strokeWidth="1">
        <path d="M24 4 L42 14 L42 30 C42 38 34 44 24 48 C14 44 6 38 6 30 L6 14 Z" />
        <path d="M16 24 L22 30 L32 18" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "Recovery",
    category: "Resilience",
    color: "#8B6CC7",
    desc: "Rapid incident response and system restoration with automated backups, rollback capabilities, and continuity planning.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="#8B6CC7" strokeWidth="1">
        <circle cx="24" cy="24" r="18" />
        <polyline points="24,10 24,24 34,30" strokeWidth="1.5" />
        <path d="M8 24 C8 14 16 6 24 6" strokeDasharray="2 2" />
        <circle cx="24" cy="24" r="3" fill="#8B6CC7" fillOpacity="0.3" />
      </svg>
    ),
  },
];

export default function Services() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="services"
      ref={ref}
      className="relative bg-[#121212] py-28 md:py-36"
    >
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Left: Title */}
          <div className="lg:col-span-4">
            <ScrollReveal direction="up">
              <div className="inline-flex items-center gap-2 mb-6">
                <Shield className="w-4 h-4 text-[#C8442C] stroke-[1.8]" />
                <span className="text-[11px] font-semibold text-[#C8442C] tracking-widest uppercase">
                  Services
                </span>
              </div>
              <TextReveal
                as="h2"
                delay={0.1}
                className="text-[clamp(2rem,4vw,3rem)] font-light leading-[1.12] tracking-tight text-white"
              >
                Security that never{" "}
                <span className="text-[#8ED7A3]">sleeps</span>
              </TextReveal>
              <p className="mt-5 text-[15px] text-white/40 leading-relaxed max-w-sm font-light">
                Comprehensive protection across every layer of your digital
                infrastructure, powered by continuous AI monitoring.
              </p>
            </ScrollReveal>
          </div>

          {/* Right: Cards grid with stagger */}
          <StaggerChildren stagger={0.1} delay={0.15} className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((svc) => (
              <motion.div
                key={svc.title}
                variants={staggerItem}
                onMouseEnter={() => { resumeAudio(); playHover(); }}
                className="group relative bg-white/[0.04] border border-white/[0.06] p-6 hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
              >
                {/* Pixel corner ornament */}
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/[0.1]" />

                {/* Category dot + label */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                    style={{ backgroundColor: svc.color }}
                  />
                  <span className="text-[10px] font-semibold text-white/35 tracking-widest uppercase">
                    {svc.category}
                  </span>
                </div>

                {/* Icon */}
                <div className="mb-4 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                  {svc.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-normal text-white tracking-tight mb-3">
                  {svc.title}
                </h3>

                {/* Divider */}
                <LineReveal color="rgba(255,255,255,0.06)" className="mb-3" />

                {/* Description */}
                <p className="text-[13px] text-white/40 leading-relaxed font-light">
                  {svc.desc}
                </p>
              </motion.div>
            ))}

            {/* CTA Block */}
            <motion.div
              variants={staggerItem}
              className="flex flex-col items-center justify-center bg-[#C8442C]/[0.08] border border-[#C8442C]/20 p-6 text-center"
            >
              <p className="text-sm text-white/60 font-light mb-4">
                Need specialized protection?
              </p>
              <a
                href="#contact"
                onClick={() => { resumeAudio(); playClick(); }}
                className="inline-flex items-center px-6 py-2.5 bg-[#C8442C] text-white text-[13px] font-medium rounded-full hover:bg-[#B83A24] transition-all duration-300"
              >
                More services
              </a>
            </motion.div>
          </StaggerChildren>
        </div>
      </div>
    </section>
  );
}
