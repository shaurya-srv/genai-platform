import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { playClick, playClickSoft, resumeAudio } from "@/lib/sounds";
import { ScrollReveal, MagneticButton } from "./animations";

export default function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="contact"
      ref={ref}
      className="relative bg-[#C8442C] overflow-hidden"
    >
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
        <svg width="100%" height="100%">
          <filter id="ctaNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#ctaNoise)" />
        </svg>
      </div>

      {/* Circuit lines - left */}
      <div className="absolute left-0 top-0 bottom-0 w-1/3 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" preserveAspectRatio="none">
          <motion.line x1="0" y1="80" x2="200" y2="80" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, delay: 0.3 }} />
          <motion.line x1="0" y1="200" x2="280" y2="200" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, delay: 0.5 }} />
          <motion.line x1="0" y1="320" x2="160" y2="320" stroke="rgba(255,255,255,0.1)" strokeWidth="0.75" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, delay: 0.7 }} />
          <motion.circle cx="200" cy="80" r="3" fill="rgba(255,255,255,0.2)" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.3, delay: 1.5 }} />
          <motion.circle cx="280" cy="200" r="3" fill="rgba(255,255,255,0.15)" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.3, delay: 1.7 }} />
          <motion.circle cx="160" cy="320" r="3" fill="rgba(255,255,255,0.18)" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.3, delay: 1.9 }} />
        </svg>
      </div>

      {/* Circuit lines - right */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" preserveAspectRatio="none">
          <motion.line x1="200" y1="120" x2="400" y2="120" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, delay: 0.4 }} />
          <motion.line x1="120" y1="240" x2="400" y2="240" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, delay: 0.6 }} />
          <motion.line x1="240" y1="360" x2="400" y2="360" stroke="rgba(255,255,255,0.1)" strokeWidth="0.75" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, delay: 0.8 }} />
          <motion.circle cx="200" cy="120" r="3" fill="rgba(255,255,255,0.2)" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.3, delay: 1.6 }} />
          <motion.circle cx="120" cy="240" r="3" fill="rgba(255,255,255,0.15)" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.3, delay: 1.8 }} />
          <motion.circle cx="240" cy="360" r="3" fill="rgba(255,255,255,0.18)" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.3, delay: 2.0 }} />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1320px] px-6 lg:px-10 py-24 md:py-32 text-center">
        <ScrollReveal distance={20}>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-light leading-[1.15] tracking-tight text-white max-w-2xl mx-auto">
            Build a resilient security strategy for the future
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2} distance={16}>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <MagneticButton strength={0.15}>
              <a
                href="#"
                onClick={() => { resumeAudio(); playClick(); }}
                className="inline-block px-7 py-3 bg-white text-[#C8442C] text-sm font-medium rounded-full hover:bg-white/90 transition-all duration-300"
              >
                View pricing
              </a>
            </MagneticButton>
            <MagneticButton strength={0.15}>
              <a
                href="#contact"
                onClick={() => { resumeAudio(); playClickSoft(); }}
                className="inline-block px-7 py-3 bg-[#121212] text-white text-sm font-medium rounded-full hover:bg-[#1A1A1A] transition-all duration-300"
              >
                Contact us
              </a>
            </MagneticButton>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
