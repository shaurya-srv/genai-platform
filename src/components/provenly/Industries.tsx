import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const industries = [
  {
    title: "Education",
    desc: "Protecting student data, research networks, and institutional infrastructure from targeted attacks.",
    icon: (
      <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none" stroke="#121212" strokeWidth="1.2">
        <path d="M20 6 L36 14 L20 22 L4 14 Z" />
        <path d="M8 16 L8 28 C8 28 14 34 20 34 C26 34 32 28 32 28 L32 16" />
        <line x1="36" y1="14" x2="36" y2="30" />
      </svg>
    ),
  },
  {
    title: "Government",
    desc: "Securing classified communications, citizen records, and critical national infrastructure systems.",
    icon: (
      <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none" stroke="#121212" strokeWidth="1.2">
        <rect x="6" y="16" width="28" height="20" rx="1" />
        <line x1="6" y1="16" x2="20" y2="6" />
        <line x1="34" y1="16" x2="20" y2="6" />
        <line x1="12" y1="20" x2="12" y2="32" />
        <line x1="20" y1="20" x2="20" y2="32" />
        <line x1="28" y1="20" x2="28" y2="32" />
      </svg>
    ),
  },
  {
    title: "Sports",
    desc: "Defending event platforms, fan data, broadcast systems, and connected venue infrastructure.",
    icon: (
      <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none" stroke="#121212" strokeWidth="1.2">
        <circle cx="20" cy="20" r="14" />
        <path d="M20 6 C14 14 14 26 20 34" />
        <path d="M20 6 C26 14 26 26 20 34" />
        <line x1="6" y1="20" x2="34" y2="20" />
      </svg>
    ),
  },
  {
    title: "Transport",
    desc: "Hardening fleet management, logistics networks, autonomous systems, and control infrastructure.",
    icon: (
      <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none" stroke="#121212" strokeWidth="1.2">
        <path d="M6 28 L14 12 L26 12 L34 28" />
        <circle cx="12" cy="30" r="4" />
        <circle cx="28" cy="30" r="4" />
        <line x1="14" y1="20" x2="26" y2="20" />
      </svg>
    ),
  },
];

export default function Industries() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="relative bg-[#F2F3F4] py-20 border-t border-black/[0.04]">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-[11px] font-semibold text-black/35 tracking-widest uppercase">
            Industries we served
          </span>
        </motion.div>

        {/* Four columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {industries.map((ind, i) => (
            <motion.div
              key={ind.title}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              className={[
                "py-8 px-6 border-black/[0.06]",
                i < industries.length - 1 ? "lg:border-r" : "",
                i > 0 ? "border-t lg:border-t-0" : "",
              ].join(" ")}
            >
              <div className="mb-4 opacity-60">{ind.icon}</div>
              <h4 className="text-sm font-semibold text-[#121212] mb-2 tracking-tight">
                {ind.title}
              </h4>
              <p className="text-[13px] text-black/40 leading-relaxed font-light">
                {ind.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
