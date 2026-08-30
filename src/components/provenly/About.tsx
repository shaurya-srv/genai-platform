import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield } from "lucide-react";
import { ScrollReveal, TextReveal, StaggerChildren, staggerItem, LineReveal } from "./animations";

export default function About() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="about"
      ref={ref}
      className="relative bg-[#F2F3F4] py-28 md:py-36 overflow-hidden"
    >
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12 items-start">
          {/* Left Column */}
          <div className="lg:border-r lg:border-black/[0.06] lg:pr-12">
            {/* Label */}
            <ScrollReveal direction="up" delay={0}>
              <div className="inline-flex items-center gap-2 mb-8">
                <Shield className="w-4 h-4 text-[#C8442C] stroke-[1.8]" />
                <span className="text-[11px] font-semibold text-[#C8442C] tracking-widest uppercase">
                  About Provenly
                </span>
              </div>
            </ScrollReveal>

            <TextReveal
              as="h2"
              delay={0.1}
              className="text-[clamp(2rem,4vw,3rem)] font-light leading-[1.12] tracking-tight text-[#121212] max-w-lg"
            >
              Combining <span className="text-[#C8442C]">AI intelligence</span>{" "}
              with proactive security
            </TextReveal>

            <ScrollReveal delay={0.25}>
              <p className="mt-6 text-[15px] leading-relaxed text-black/55 max-w-md font-light">
                We believe security should anticipate, not react. Our platform
                leverages machine learning and behavioral analytics to identify
                threats before they materialize, giving organizations the confidence
                to operate without compromise.
              </p>
            </ScrollReveal>

            <LineReveal delay={0.4} color="rgba(0,0,0,0.06)" className="mt-12" />

            {/* Founder Quote */}
            <ScrollReveal delay={0.45}>
              <div className="pt-8">
                <blockquote className="text-[15px] italic text-black/50 leading-relaxed max-w-md">
                  &ldquo;In a world where threats evolve faster than defenses, we
                  chose to build something that evolves faster than threats.&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#121212]/[0.07] flex items-center justify-center">
                    <span className="text-sm font-semibold text-[#121212]/60">
                      MR
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#121212]">
                      Marcus Reeves
                    </p>
                    <p className="text-[12px] text-black/40 font-medium">
                      Founder & CEO
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column - Isometric Cube */}
          <ScrollReveal direction="right" delay={0.2} className="mt-12 lg:mt-0">
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                {/* Isometric Cube */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg
                    width="260"
                    height="280"
                    viewBox="0 0 260 280"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M130 30 L230 80 L130 130 L30 80 Z" fill="#C8442C" fillOpacity="0.9" />
                    <path d="M30 80 L130 130 L130 220 L30 170 Z" fill="#E8E9EA" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
                    <path d="M130 130 L230 80 L230 170 L130 220 Z" fill="#D5D6D7" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
                    {[0.25, 0.5, 0.75].map((t) => {
                      const x1 = 30 + t * 100;
                      const y1 = 80 + t * 50;
                      const y2 = y1 + 90;
                      return (
                        <line key={`l${t}`} x1={x1} y1={y1} x2={x1} y2={y2} stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
                      );
                    })}
                    {[0.25, 0.5, 0.75].map((t) => {
                      const x1 = 130 + t * 100;
                      const y1 = 130 - t * 50;
                      const y2 = y1 + 90;
                      return (
                        <line key={`r${t}`} x1={x1} y1={y1} x2={x1} y2={y2} stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
                      );
                    })}
                  </svg>
                </motion.div>

                {/* Predict pill */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-8 right-4 lg:right-0 px-3 py-1.5 bg-[#8ED7A3]/[0.15] border border-[#8ED7A3]/30 rounded-full"
                >
                  <span className="text-[11px] font-semibold text-[#8ED7A3] tracking-wider uppercase">
                    Predict
                  </span>
                </motion.div>
              </div>

              <ScrollReveal delay={0.5}>
                <p className="mt-4 text-[13px] text-black/40 max-w-xs text-center lg:text-left font-light">
                  Our predictive engine continuously analyzes patterns across your
                  infrastructure to surface risks before they become incidents.
                </p>
              </ScrollReveal>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
