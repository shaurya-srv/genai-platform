import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TextReveal, StaggerChildren, staggerItem, LineReveal } from "./animations";
import { RadarScan } from "./Illustrations";

const steps = [
  {
    num: "01",
    title: "Predict Threats",
    desc: "Our AI models analyze global threat intelligence, dark web chatter, and your infrastructure patterns to forecast potential attack vectors before they emerge.",
    icon: (
      <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8">
        <rect x="8" y="8" width="48" height="48" rx="2" strokeDasharray="3 3" />
        <path d="M16 48 L28 32 L36 38 L48 20" strokeWidth="1" />
        <circle cx="48" cy="20" r="3" fill="#C8442C" fillOpacity="0.6" stroke="none" />
        <line x1="48" y1="14" x2="48" y2="8" strokeDasharray="2 2" />
        <line x1="54" y1="20" x2="56" y2="20" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Detect Anomalies",
    desc: "Continuous behavioral monitoring identifies deviations from baseline patterns, flagging suspicious activity across endpoints, networks, and cloud environments.",
    icon: (
      <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8">
        <circle cx="32" cy="32" r="24" strokeDasharray="3 3" />
        <circle cx="32" cy="32" r="14" />
        <circle cx="32" cy="32" r="4" fill="#8ED7A3" fillOpacity="0.4" stroke="none" />
        <line x1="32" y1="8" x2="32" y2="18" />
        <line x1="32" y1="46" x2="32" y2="56" />
        <line x1="8" y1="32" x2="18" y2="32" />
        <line x1="46" y1="32" x2="56" y2="32" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Automate Defense",
    desc: "Intelligent response orchestration triggers automated containment, blocking, and remediation workflows the instant a verified threat is detected.",
    icon: (
      <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8">
        <path d="M32 8 L52 20 L52 44 L32 56 L12 44 L12 20 Z" strokeDasharray="3 3" />
        <path d="M22 32 L30 40 L42 24" strokeWidth="1.2" stroke="#8ED7A3" strokeOpacity="0.6" />
        <circle cx="32" cy="32" r="8" strokeWidth="0.6" />
      </svg>
    ),
  },
];

export default function Process() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="relative bg-[#121212] py-28 md:py-36 border-t border-white/[0.04]">
      {/* Decorative radar in background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
        <RadarScan className="w-[600px] h-[600px]" />
      </div>
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        {/* Section Title */}
        <div className="text-center mb-16">
          <TextReveal
            className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.15] tracking-tight text-white"
          >
            Intelligence behind every{" "}
            <span className="text-[#8ED7A3]">decision</span>
          </TextReveal>
        </div>

        {/* Process Cards with stagger */}
        <StaggerChildren stagger={0.12} delay={0.2} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step) => (
            <motion.div
              key={step.num}
              variants={staggerItem}
              className="relative bg-[#1A1A1A] border border-white/[0.06] p-7 hover:border-white/[0.1] transition-all duration-500 group"
            >
              {/* Pixel corner ornament */}
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/[0.1]" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/[0.06]" />

              {/* Number */}
              <span className="text-[10px] font-semibold text-white/20 tracking-widest">
                {step.num}
              </span>

              {/* Icon */}
              <div className="my-5 flex justify-center opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                {step.icon}
              </div>

              {/* Title */}
              <h3 className="text-base font-normal text-white tracking-tight mb-3 text-center">
                {step.title}
              </h3>

              {/* Divider */}
              <div className="w-8 h-px bg-white/[0.08] mx-auto mb-3" />

              {/* Description */}
              <p className="text-[13px] text-white/35 leading-relaxed font-light text-center">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </StaggerChildren>

        {/* Decorative rules */}
        <div className="mt-12 flex flex-col items-center gap-2">
          <LineReveal color="rgba(255,255,255,0.06)" className="w-24" />
          <LineReveal color="rgba(255,255,255,0.04)" delay={0.1} className="w-16" />
          <LineReveal color="rgba(255,255,255,0.03)" delay={0.2} className="w-12" />
        </div>
      </div>
    </section>
  );
}
