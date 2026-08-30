"use client";

import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState, useEffect, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  ScrollReveal — fade + slide container                              */
/* ------------------------------------------------------------------ */

interface ScrollRevealProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
  distance?: number;
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.7,
  className = "",
  distance = 40,
}: ScrollRevealProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const dirMap = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...dirMap[direction] }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  TextReveal — clip-path reveal for headings                         */
/* ------------------------------------------------------------------ */

interface TextRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function TextReveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "h2",
}: TextRevealProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <Tag className={className}>
      <motion.span ref={ref} className="block overflow-hidden">
        <motion.span
          className="block"
          initial={{ y: "110%" }}
          animate={inView ? { y: "0%" } : {}}
          transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
        >
          {children}
        </motion.span>
      </motion.span>
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  AnimatedCounter — number counting up on scroll                     */
/* ------------------------------------------------------------------ */

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
  suffix = "",
  prefix = "",
  decimals = 0,
  className = "",
}: AnimatedCounterProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = (now - start) / (duration * 1000);
      if (elapsed >= 1) {
        setDisplay(to);
        return;
      }
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setDisplay(from + (to - from) * eased);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, from, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  MagneticButton — cursor proximity magnet effect                    */
/* ------------------------------------------------------------------ */

interface MagneticButtonProps {
  children: ReactNode;
  strength?: number;
  className?: string;
  onClick?: () => void;
}

export function MagneticButton({
  children,
  strength = 0.3,
  className = "",
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  StaggerChildren — staggered reveal for child elements              */
/* ------------------------------------------------------------------ */

interface StaggerChildrenProps {
  children: ReactNode;
  stagger?: number;
  className?: string;
  delay?: number;
}

export function StaggerChildren({
  children,
  stagger = 0.08,
  className = "",
  delay = 0,
}: StaggerChildrenProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

/* ------------------------------------------------------------------ */
/*  LineReveal — horizontal line that draws on scroll                  */
/* ------------------------------------------------------------------ */

interface LineRevealProps {
  delay?: number;
  className?: string;
  color?: string;
}

export function LineReveal({
  delay = 0,
  className = "",
  color = "rgba(255,255,255,0.08)",
}: LineRevealProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });

  return (
    <div ref={ref} className={`h-px ${className}`}>
      <motion.div
        className="h-full origin-left"
        style={{ backgroundColor: color }}
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2, delay, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      />
    </div>
  );
}
