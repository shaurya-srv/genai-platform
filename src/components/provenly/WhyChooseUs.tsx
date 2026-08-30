import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { playHover, resumeAudio } from "@/lib/sounds";
import { ScrollReveal, TextReveal, StaggerChildren, staggerItem, AnimatedCounter } from "./animations";

export default function WhyChooseUs() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      className="relative bg-[#F2F3F4] py-28 md:py-36 overflow-hidden"
    >
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        {/* Heading */}
        <div className="text-center mb-16">
          <TextReveal
            className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.15] tracking-tight text-[#121212]"
          >
            Where protection meets{" "}
            <span className="text-[#C8442C]">innovation</span>
          </TextReveal>
        </div>

        {/* Asymmetric Collage Grid with stagger */}
        <StaggerChildren stagger={0.08} delay={0.15} className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px] lg:auto-rows-[200px]">
          {/* Large analytics chart card */}
          <motion.div
            variants={staggerItem}
            className="col-span-2 row-span-2 bg-white border border-black/[0.04] p-7 flex flex-col relative overflow-hidden group"
          >
            {/* Pixel corner */}
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-black/[0.08]" />

            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8ED7A3]" />
              <span className="text-[10px] font-semibold text-[#8ED7A3] tracking-widest uppercase">
                Risk Reduction
              </span>
            </div>
            <p className="text-[11px] text-black/35 font-medium mb-4">
              Threat detection rate over 12 months
            </p>

            {/* Line chart */}
            <div className="flex-1 relative">
              <svg className="w-full h-full" viewBox="0 0 400 120" fill="none">
                {[0, 30, 60, 90].map((y) => (
                  <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
                ))}
                <motion.path
                  d="M0,100 C40,90 80,85 120,70 C160,55 200,60 240,40 C280,20 320,25 360,15 L400,10"
                  stroke="#C8442C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={inView ? { pathLength: 1 } : {}}
                  transition={{ duration: 2, delay: 0.6, ease: "easeOut" }}
                />
                {[[0, 100], [120, 70], [240, 40], [360, 15]].map(([x, y], i) => (
                  <motion.circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#C8442C"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.3, delay: 1.2 + i * 0.15 }}
                  />
                ))}
              </svg>
            </div>
          </motion.div>

          {/* Rust-red stat card: 99.9% with counter */}
          <motion.div
            variants={staggerItem}
            onMouseEnter={() => { resumeAudio(); playHover(); }}
            className="bg-[#C8442C] text-white p-7 flex flex-col justify-end relative overflow-hidden group cursor-default"
          >
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-white/20" />
            <p className="text-4xl lg:text-5xl font-light tracking-tight">
              <AnimatedCounter to={99.9} decimals={1} suffix="%" duration={1.5} />
            </p>
            <p className="text-[12px] text-white/60 mt-2 font-medium">
              Platform uptime guarantee
            </p>
          </motion.div>

          {/* Protection card with isometric diamond */}
          <motion.div
            variants={staggerItem}
            className="bg-white border border-black/[0.04] p-5 flex items-center justify-center relative overflow-hidden"
          >
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <path d="M40 10 L70 30 L40 50 L10 30 Z" fill="#C8442C" fillOpacity="0.15" stroke="#C8442C" strokeWidth="0.75" />
              <path d="M40 25 L60 38 L40 51 L20 38 Z" fill="#D5D6D7" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
              <path d="M40 10 L40 50" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            </svg>
          </motion.div>

          {/* 500M+ stat card with counter */}
          <motion.div
            variants={staggerItem}
            onMouseEnter={() => { resumeAudio(); playHover(); }}
            className="bg-white border border-black/[0.04] p-7 flex flex-col justify-end relative cursor-default"
          >
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-black/[0.08]" />
            <p className="text-3xl lg:text-4xl font-light tracking-tight text-[#121212]">
              <AnimatedCounter to={500} suffix="M+" duration={2} />
            </p>
            <p className="text-[12px] text-black/40 mt-2 font-medium">
              Threats blocked annually
            </p>
          </motion.div>

          {/* Portrait image tile */}
          <motion.div
            variants={staggerItem}
            className="bg-[#1A1A1A] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2a] to-[#121212]" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center">
                <span className="text-xs text-white/40 font-medium">MR</span>
              </div>
            </div>
          </motion.div>

          {/* Wide testimonial card */}
          <motion.div
            variants={staggerItem}
            className="col-span-2 bg-white border border-black/[0.04] p-7 flex flex-col justify-between relative"
          >
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-black/[0.08]" />
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8ED7A3]" />
              <span className="text-[10px] font-semibold text-[#8ED7A3] tracking-widest uppercase">
                Review
              </span>
            </div>
            <blockquote className="text-[14px] text-[#121212]/70 leading-relaxed font-light italic max-w-md">
              &ldquo;Provenly transformed how we approach security. Their
              predictive platform caught threats our previous vendor never
              even detected.&rdquo;
            </blockquote>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#121212]/[0.07] flex items-center justify-center">
                <span className="text-[10px] font-semibold text-[#121212]/50">SJ</span>
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#121212]">Sarah Jenkins</p>
                <p className="text-[10px] text-black/35">CISO, NexaBank</p>
              </div>
            </div>
          </motion.div>
        </StaggerChildren>
      </div>
    </section>
  );
}
