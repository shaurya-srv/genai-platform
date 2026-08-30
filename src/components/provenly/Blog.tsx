import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { playClick, playHover, resumeAudio } from "@/lib/sounds";

const articles = [
  {
    author: "Marcus Reeves",
    date: "Aug 15, 2026",
    title: "Why predictive security is the only viable strategy in 2026",
  },
  {
    author: "Elena Vasquez",
    date: "Aug 08, 2026",
    title: "The hidden cost of reactive incident response for enterprise",
  },
  {
    author: "David Chen",
    date: "Jul 29, 2026",
    title: "Building zero-trust architecture without sacrificing performance",
  },
];

export default function Blog() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="blog"
      ref={ref}
      className="relative bg-[#F2F3F4] py-28 md:py-36"
    >
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-14"
        >
          <div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-light leading-[1.15] tracking-tight text-[#121212]">
              Staying ahead of evolving{" "}
              <span className="text-[#C8442C]">threats</span>
            </h2>
          </div>
          <a
            href="#"
            onClick={() => { resumeAudio(); playClick(); }}
            className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2 bg-[#C8442C] text-white text-[13px] font-medium rounded-full hover:bg-[#B83A24] transition-all duration-300 self-start sm:self-auto"
          >
            View all
          </a>
        </motion.div>

        {/* Article List */}
        <div className="max-w-2xl">
          {articles.map((article, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
              className="group"
            >
              <div className="py-7">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-medium text-black/35">
                    {article.author}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-black/15" />
                  <span className="text-[11px] text-black/30">
                    {article.date}
                  </span>
                </div>
                <a
                  href="#"
                  onClick={() => { resumeAudio(); playClick(); }}
                  onMouseEnter={() => { resumeAudio(); playHover(); }}
                  className="inline-flex items-start gap-2 group/link"
                >
                  <h3 className="text-lg md:text-xl font-light text-[#121212] leading-snug group-hover/link:text-[#C8442C] transition-colors duration-300">
                    {article.title}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-[#C8442C] mt-1 opacity-0 group-hover/link:opacity-100 group-hover/link:translate-x-1 transition-all duration-300" />
                </a>
              </div>
              {i < articles.length - 1 && (
                <div className="h-px bg-black/[0.06]" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
