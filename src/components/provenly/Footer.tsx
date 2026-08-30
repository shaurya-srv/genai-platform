import { Shield, ExternalLink, ArrowRight } from "lucide-react";
import { playClick, playNav, playHover, playTick, resumeAudio } from "@/lib/sounds";

const footerLinks = {
  Platform: ["Threat Detection", "Predictive AI", "Cloud Security", "Compliance"],
  Company: ["About", "Careers", "Blog", "Press"],
  Resources: ["Documentation", "Case Studies", "Whitepapers", "API"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"],
};

export default function Footer() {
  return (
    <footer className="relative bg-[#121212] overflow-hidden">
      {/* Three red rules */}
      <div className="flex flex-col items-center gap-1.5 pt-8 pb-6">
        <div className="w-20 h-px bg-[#C8442C]/60" />
        <div className="w-14 h-px bg-[#C8442C]/40" />
        <div className="w-10 h-px bg-[#C8442C]/25" />
      </div>

      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-16">
          {/* Left: Brand + Newsletter */}
          <div className="lg:col-span-5">
            <a href="#home" onClick={() => { resumeAudio(); playNav(); }} className="inline-flex items-center gap-2 mb-5">
              <Shield className="w-6 h-6 text-[#C8442C] stroke-[1.8]" />
              <span className="text-white text-lg font-semibold tracking-tight">
                Provenly
              </span>
            </a>
            <p className="text-[13px] text-white/35 leading-relaxed max-w-xs mb-6 font-light">
              AI-powered cybersecurity that predicts threats, detects anomalies,
              and automates defense for modern organizations.
            </p>

            {/* Email capture */}
            <div className="flex items-center gap-2 max-w-xs">
              <div className="flex-1 relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-full text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/15 transition-colors"
                />
              </div>
              <button
                onClick={() => { resumeAudio(); playClick(); }}
                className="w-10 h-10 rounded-full bg-[#C8442C] flex items-center justify-center hover:bg-[#B83A24] transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Right: Navigation columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-[11px] font-semibold text-white/50 tracking-widest uppercase mb-4">
                  {category}
                </h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        onClick={() => { resumeAudio(); playNav(); }}
                        onMouseEnter={() => { resumeAudio(); playHover(); }}
                        className="text-[13px] text-white/30 hover:text-white/60 transition-colors duration-300 font-light"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.05] py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-white/20 font-light">
            &copy; {new Date().getFullYear()} Provenly. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {['Twitter', 'LinkedIn', 'GitHub'].map((name, i) => (
              <a
                key={i}
                href="#"
                onClick={() => { resumeAudio(); playTick(); }}
                onMouseEnter={() => { resumeAudio(); playHover(); }}
                className="w-8 h-8 rounded-full border border-white/[0.06] flex items-center justify-center text-white/25 hover:text-white/50 hover:border-white/[0.12] transition-all duration-300"
                title={name}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Oversized watermark text */}
      <div className="relative -mb-8 overflow-hidden pointer-events-none select-none">
        <p
          className="text-[clamp(5rem,14vw,12rem)] font-bold text-white/[0.02] tracking-tight leading-none text-center whitespace-nowrap"
          aria-hidden="true"
        >
          Active Defense
        </p>
      </div>
    </footer>
  );
}
