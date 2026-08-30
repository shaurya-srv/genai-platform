import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Shield, Star } from "lucide-react";
import { playSwitch, playHover, resumeAudio } from "@/lib/sounds";

const testimonials = [
  {
    quote:
      "Provenly gave us visibility into threats we never knew existed. Their AI-driven approach has fundamentally changed how we protect our infrastructure.",
    name: "Sarah Jenkins",
    role: "CISO, NexaBank",
    initials: "SJ",
  },
  {
    quote:
      "The speed of detection is extraordinary. What used to take our team days to identify is now flagged in real-time with context-rich alerts.",
    name: "David Chen",
    role: "VP Engineering, CloudSync",
    initials: "DC",
  },
  {
    quote:
      "We needed a partner who understood both the technical and regulatory landscape. Provenly delivered on both fronts without compromise.",
    name: "Amara Okafor",
    role: "CTO, VertexHealth",
    initials: "AO",
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [active, setActive] = useState(0);

  return (
    <section
      ref={ref}
      className="relative bg-[#121212] py-28 md:py-40 overflow-hidden"
    >
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-2 mb-12"
        >
          <Shield className="w-4 h-4 text-[#C8442C] stroke-[1.8]" />
          <span className="text-[11px] font-semibold text-white/40 tracking-widest uppercase">
            Testimonials
          </span>
        </motion.div>

        {/* Quote */}
        <div className="max-w-3xl mx-auto text-center min-h-[160px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <blockquote className="text-[clamp(1.2rem,2.5vw,1.75rem)] font-light leading-[1.35] text-white/90 tracking-tight">
                &ldquo;{testimonials[active].quote}&rdquo;
              </blockquote>

              {/* Stars */}
              <div className="flex items-center gap-1 mt-8">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star
                    key={s}
                    className="w-4 h-4 text-[#8ED7A3] fill-[#8ED7A3]"
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tab selector */}
        <div className="mt-14 flex items-center justify-center gap-3 flex-wrap">
          {testimonials.map((t, i) => (
            <button
              key={i}
              onClick={() => { resumeAudio(); playSwitch(); setActive(i); }}
              onMouseEnter={() => { resumeAudio(); playHover(); }}
              className={`flex items-center gap-3 px-5 py-3 rounded-md transition-all duration-300 border ${
                active === i
                  ? "bg-white/[0.06] border-white/[0.1]"
                  : "bg-transparent border-white/[0.04] hover:border-white/[0.08]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors duration-300 ${
                  active === i
                    ? "bg-[#C8442C]/20 text-[#C8442C]"
                    : "bg-white/[0.05] text-white/30"
                }`}
              >
                {t.initials}
              </div>
              <div className="text-left hidden sm:block">
                <p
                  className={`text-[12px] font-medium transition-colors duration-300 ${
                    active === i ? "text-white" : "text-white/40"
                  }`}
                >
                  {t.name}
                </p>
                <p className="text-[10px] text-white/25">{t.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
