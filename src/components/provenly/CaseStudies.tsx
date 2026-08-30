import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { playClick, playHover, resumeAudio } from "@/lib/sounds";
import { ScrollReveal, TextReveal, StaggerChildren, staggerItem } from "./animations";

const cases = [
  {
    company: "NexaBank",
    outcome: "Reduced breach exposure by 94% across global operations",
    metrics: [
      { value: "94%", label: "Risk Reduction" },
      { value: "< 3min", label: "Response Time" },
    ],
    image: "linear-gradient(135deg, #1a1a1a 0%, #2a2020 50%, #1a1a1a 100%)",
  },
  {
    company: "CloudSync",
    outcome: "Secured 2,400+ cloud instances with zero downtime migration",
    metrics: [
      { value: "2,400+", label: "Instances Secured" },
      { value: "0", label: "Downtime Hours" },
    ],
    image: "linear-gradient(135deg, #1a1a2a 0%, #20202a 50%, #1a1a2a 100%)",
  },
  {
    company: "VertexHealth",
    outcome: "Achieved HIPAA compliance while deploying AI diagnostics",
    metrics: [
      { value: "100%", label: "Compliance" },
      { value: "60%", label: "Cost Savings" },
    ],
    image: "linear-gradient(135deg, #1a2a1a 0%, #202a20 50%, #1a2a1a 100%)",
  },
];

export default function CaseStudies() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="case-studies"
      ref={ref}
      className="relative bg-[#F2F3F4] py-28 md:py-36"
    >
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-14">
          <TextReveal
            as="h2"
            className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.15] tracking-tight text-[#121212]"
          >
            Securing businesses with{" "}
            <span className="text-[#C8442C]">confidence</span>
          </TextReveal>
          <ScrollReveal delay={0.2}>
            <a
              href="#"
              onClick={() => { resumeAudio(); playClick(); }}
              className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2 bg-[#C8442C] text-white text-[13px] font-medium rounded-full hover:bg-[#B83A24] transition-all duration-300 self-start sm:self-auto"
            >
              View all
            </a>
          </ScrollReveal>
        </div>

        {/* Case study rows */}
        <StaggerChildren stagger={0.15} className="space-y-6">
          {cases.map((cs) => (
            <motion.div
              key={cs.company}
              variants={staggerItem}
              className="group grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white border border-black/[0.04] hover:shadow-lg hover:shadow-black/[0.04] transition-all duration-500"
            >
              {/* Left: Content */}
              <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center">
                <p className="text-[11px] font-semibold text-[#C8442C] tracking-widest uppercase mb-3">
                  {cs.company}
                </p>
                <h3 className="text-lg md:text-xl font-light text-[#121212] leading-snug mb-6 max-w-md">
                  {cs.outcome}
                </h3>

                <div className="flex items-center gap-6 mb-6">
                  {cs.metrics.map((m) => (
                    <div key={m.label}>
                      <p className="text-2xl font-light text-[#121212] tracking-tight">
                        {m.value}
                      </p>
                      <p className="text-[11px] text-black/40 font-medium mt-0.5">
                        {m.label}
                      </p>
                    </div>
                  ))}
                </div>

                <a
                  href="#"
                  onClick={() => { resumeAudio(); playClick(); }}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#C8442C] group-hover:gap-2.5 transition-all duration-300"
                >
                  View details
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Right: Image with parallax hover */}
              <div
                className="lg:col-span-5 relative overflow-hidden min-h-[220px]"
                onMouseEnter={() => { resumeAudio(); playHover(); }}
              >
                <div
                  className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  style={{ background: cs.image }}
                />
                {/* Red light fixture element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-32 h-6 bg-[#C8442C]/80 rounded-sm shadow-lg shadow-[#C8442C]/20" />
                  <div className="w-32 h-24 bg-[#C8442C]/10 mx-auto rounded-b-sm" />
                </div>
                {/* Silhouette figure */}
                <div className="absolute bottom-6 left-8 w-12 h-20 bg-white/[0.06] rounded-t-full" />
              </div>
            </motion.div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
