import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, ChevronDown } from "lucide-react";
import { playNav, playClick, playSwitch, resumeAudio } from "@/lib/sounds";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#121212]/95 backdrop-blur-md border-b border-white/[0.06]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <a href="#home" className="flex items-center gap-2.5 group" onClick={() => { resumeAudio(); playNav(); }}>
              <div className="relative flex items-center justify-center w-8 h-8">
                <Shield className="w-7 h-7 text-[#C8442C] stroke-[1.8]" />
              </div>
              <span className="text-white text-lg font-semibold tracking-tight">
                Provenly
              </span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => { resumeAudio(); playNav(); }}
                  className="px-4 py-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors duration-300 tracking-wide"
                >
                  {link.label}
                </a>
              ))}
              <div className="relative">
                <button
                  onClick={() => { resumeAudio(); playSwitch(); setPagesOpen(!pagesOpen); }}
                  className="flex items-center gap-1 px-4 py-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors duration-300 tracking-wide"
                >
                  All Pages
                  <ChevronDown className="w-3 h-3 mt-0.5" />
                </button>
                <AnimatePresence>
                  {pagesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-1 w-48 bg-[#1A1A1A] border border-white/[0.08] rounded-md py-1 shadow-xl"
                    >
                      {["Home", "About", "Services", "Case Studies", "Blog", "Contact"].map(
                        (item) => (
                          <a
                            key={item}
                            href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
                            className="block px-4 py-2 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                            onClick={() => setPagesOpen(false)}
                          >
                            {item}
                          </a>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* CTA + Mobile toggle */}
            <div className="flex items-center gap-4">
              <a
                href="#contact"
                onClick={() => { resumeAudio(); playClick(); }}
                className="hidden md:inline-flex items-center px-5 py-2 text-[13px] font-medium bg-white text-[#121212] rounded-full hover:bg-white/90 transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
              >
                Contact us
              </a>
              <button
                onClick={() => { resumeAudio(); playSwitch(); setMobileOpen(!mobileOpen); }}
                className="md:hidden text-white/70 hover:text-white p-1"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        {/* Thin bottom divider */}
        <div
          className={`h-px transition-opacity duration-500 ${
            scrolled ? "opacity-100" : "opacity-0"
          } bg-white/[0.06]`}
        />
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-40 bg-[#121212]/98 backdrop-blur-lg md:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full gap-6">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="text-2xl font-light text-white/80 hover:text-white transition-colors"
                  onClick={() => { resumeAudio(); playNav(); setMobileOpen(false); }}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="#contact"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-4 px-8 py-3 bg-[#C8442C] text-white text-sm font-medium rounded-full"
                onClick={() => { resumeAudio(); playClick(); setMobileOpen(false); }}
              >
                Contact us
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
