import { motion, useInView } from "framer-motion";
import { useRef, useEffect } from "react";
import { playClick, playClickSoft, playSuccess, resumeAudio } from "@/lib/sounds";
import { ScrollReveal } from "./animations";
import { ShieldIllustration } from "./Illustrations";

const techNodes = [
  { label: "AI", x: -220, y: -80 },
  { label: "Cloud", x: 220, y: -80 },
  { label: "Zero Trust", x: -280, y: 60 },
  { label: "ML", x: 280, y: 60 },
  { label: "SOC", x: -160, y: 140 },
  { label: "API", x: 160, y: 140 },
];

const nodeIcons: Record<string, string> = {
  AI: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  Cloud: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z",
  Ze: "M4 4h16v16H4z",
  ML: "M12 2v20M2 12h20",
  SO: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  AP: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",
};

export default function Hero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => {
        resumeAudio();
        playSuccess();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [inView]);

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#121212]"
    >
      {/* Technical grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
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
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#C8442C]/[0.03] rounded-full blur-[120px] pointer-events-none"
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-28 pb-20 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#8ED7A3] animate-pulse" />
          <span className="text-[12px] font-medium text-white/50 tracking-widest uppercase">
            AI-Powered Cybersecurity
          </span>
        </motion.div>

        {/* Headline — line-by-line clip reveal */}
        <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[1.08] tracking-tight text-white max-w-4xl mx-auto overflow-hidden">
          <motion.span
            className="block"
            initial={{ y: "110%" }}
            animate={inView ? { y: "0%" } : {}}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
          >
            AI-powered protection
          </motion.span>
          <motion.span
            className="block"
            initial={{ y: "110%" }}
            animate={inView ? { y: "0%" } : {}}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
          >
            for modern{" "}
            <span className="text-[#8ED7A3]">organizations</span>
          </motion.span>
        </h1>

        {/* Supporting copy */}
        <ScrollReveal delay={0.5} distance={20}>
          <p className="mt-6 text-base md:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed font-light">
            Provenly detects threats, secures critical systems, and reduces risk
            across your entire digital infrastructure with predictive AI defense.
          </p>
        </ScrollReveal>

        {/* Buttons with slide-up fill */}
        <ScrollReveal delay={0.65} distance={16}>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <a
              href="#contact"
              onClick={() => { resumeAudio(); playClick(); }}
              className="group relative px-7 py-3 bg-[#C8442C] text-white text-sm font-medium rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#C8442C]/20"
            >
              <span className="relative z-10">Get started</span>
              <span className="absolute inset-0 bg-[#B83A24] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </a>
            <a
              href="#about"
              onClick={() => { resumeAudio(); playClickSoft(); }}
              className="px-7 py-3 border border-white/20 text-white/80 text-sm font-medium rounded-full hover:border-white/40 hover:text-white transition-all duration-300"
            >
              Learn more
            </a>
          </div>
        </ScrollReveal>

        {/* Shield + Circuit Network */}
        <div className="relative mt-16 mx-auto" style={{ width: 600, height: 360 }}>
          {/* Circuit lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 360" fill="none">
            {techNodes.map((node, i) => {
              const cx = 300;
              const cy = 160;
              const nx = 300 + node.x;
              const ny = 160 + node.y;
              return (
                <motion.line
                  key={i}
                  x1={cx} y1={cy} x2={nx} y2={ny}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="0.75"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                  transition={{ duration: 1.4, delay: 1.4 + i * 0.12, ease: "easeOut" }}
                />
              );
            })}
          </svg>

          {/* Tech nodes with icons */}
          {techNodes.map((node, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 1.7 + i * 0.1, ease: "easeOut" }}
              className="absolute flex flex-col items-center gap-1.5"
              style={{ left: 300 + node.x - 24, top: 160 + node.y - 24 }}
            >
              <div className="w-10 h-10 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center hover:border-[#C8442C]/30 hover:bg-[#C8442C]/[0.05] transition-all duration-300 cursor-default">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={nodeIcons[node.label.slice(0, 2)] || nodeIcons.AI} />
                </svg>
              </div>
              <span className="text-[10px] text-white/25 font-medium">{node.label}</span>
            </motion.div>
          ))}

          {/* Central Shield */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1.2, delay: 1.0, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[52%]"
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ShieldIllustration className="w-40 h-44" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#121212] to-transparent pointer-events-none" />
    </section>
  );
}
