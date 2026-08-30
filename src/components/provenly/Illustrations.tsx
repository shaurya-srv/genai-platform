/**
 * Cybersecurity-themed SVG illustrations for Provenly.
 * Each is a self-contained, inline SVG component.
 */

/** Shield with data flow lines — used in Hero */
export function ShieldIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 220" fill="none" className={className}>
      {/* Shield body */}
      <defs>
        <linearGradient id="shieldGrad" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3A3A3A" />
          <stop offset="40%" stopColor="#1E1E1E" />
          <stop offset="100%" stopColor="#2A2A2A" />
        </linearGradient>
        <linearGradient id="shieldSheen" x1="60" y1="0" x2="140" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id="shieldGlow">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      {/* Glow */}
      <path d="M100 10 L180 45 L180 110 C180 155 145 190 100 210 C55 190 20 155 20 110 L20 45 Z" fill="#8ED7A3" fillOpacity="0.08" filter="url(#shieldGlow)" />
      {/* Shield */}
      <path d="M100 10 L180 45 L180 110 C180 155 145 190 100 210 C55 190 20 155 20 110 L20 45 Z" fill="url(#shieldGrad)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <path d="M100 10 L180 45 L180 110 C180 155 145 190 100 210 C55 190 20 155 20 110 L20 45 Z" fill="url(#shieldSheen)" />
      {/* Inner shield detail */}
      <path d="M100 35 L160 60 L160 105 C160 140 132 168 100 185 C68 168 40 140 40 105 L40 60 Z" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="4 4" />
      {/* Checkmark */}
      <path d="M75 105 L92 122 L128 82" stroke="#8ED7A3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Data flow dots */}
      {[30, 55, 80, 105, 130, 155, 170].map((y) => (
        <circle key={y} cx="100" cy={y} r="1" fill="#8ED7A3" fillOpacity="0.3" />
      ))}
    </svg>
  );
}

/** Network topology — used in About/Services sections */
export function NetworkTopology({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" className={className}>
      {/* Nodes */}
      <circle cx="80" cy="80" r="12" fill="#C8442C" fillOpacity="0.15" stroke="#C8442C" strokeWidth="1" />
      <circle cx="30" cy="40" r="6" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />
      <circle cx="130" cy="40" r="6" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />
      <circle cx="30" cy="120" r="6" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />
      <circle cx="130" cy="120" r="6" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />
      <circle cx="80" cy="20" r="4" fill="#8ED7A3" fillOpacity="0.3" stroke="#8ED7A3" strokeOpacity="0.5" strokeWidth="0.5" />
      <circle cx="80" cy="140" r="4" fill="#8ED7A3" fillOpacity="0.3" stroke="#8ED7A3" strokeOpacity="0.5" strokeWidth="0.5" />
      {/* Connections */}
      <line x1="80" y1="80" x2="30" y2="40" stroke="white" strokeOpacity="0.06" strokeWidth="0.5" strokeDasharray="3 3" />
      <line x1="80" y1="80" x2="130" y2="40" stroke="white" strokeOpacity="0.06" strokeWidth="0.5" strokeDasharray="3 3" />
      <line x1="80" y1="80" x2="30" y2="120" stroke="white" strokeOpacity="0.06" strokeWidth="0.5" strokeDasharray="3 3" />
      <line x1="80" y1="80" x2="130" y2="120" stroke="white" strokeOpacity="0.06" strokeWidth="0.5" strokeDasharray="3 3" />
      <line x1="80" y1="80" x2="80" y2="20" stroke="#8ED7A3" strokeOpacity="0.15" strokeWidth="0.5" />
      <line x1="80" y1="80" x2="80" y2="140" stroke="#8ED7A3" strokeOpacity="0.15" strokeWidth="0.5" />
      {/* Cross connections */}
      <line x1="30" y1="40" x2="130" y2="40" stroke="white" strokeOpacity="0.03" strokeWidth="0.5" />
      <line x1="30" y1="120" x2="130" y2="120" stroke="white" strokeOpacity="0.03" strokeWidth="0.5" />
    </svg>
  );
}

/** Radar/scan — used in Process section */
export function RadarScan({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className}>
      <circle cx="60" cy="60" r="50" stroke="white" strokeOpacity="0.06" strokeWidth="0.5" />
      <circle cx="60" cy="60" r="35" stroke="white" strokeOpacity="0.04" strokeWidth="0.5" />
      <circle cx="60" cy="60" r="20" stroke="white" strokeOpacity="0.03" strokeWidth="0.5" />
      <line x1="60" y1="10" x2="60" y2="110" stroke="white" strokeOpacity="0.04" strokeWidth="0.5" />
      <line x1="10" y1="60" x2="110" y2="60" stroke="white" strokeOpacity="0.04" strokeWidth="0.5" />
      {/* Sweep */}
      <path d="M60 60 L60 10 A50 50 0 0 1 95 25 Z" fill="#C8442C" fillOpacity="0.08" stroke="none" />
      {/* Dots */}
      <circle cx="45" cy="35" r="2" fill="#8ED7A3" fillOpacity="0.6" />
      <circle cx="78" cy="50" r="1.5" fill="#C8442C" fillOpacity="0.5" />
      <circle cx="55" cy="75" r="1.5" fill="#8ED7A3" fillOpacity="0.4" />
    </svg>
  );
}

/** Lock with circuit — used in WhyChooseUs */
export function LockCircuit({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 120" fill="none" className={className}>
      {/* Lock body */}
      <rect x="20" y="50" width="60" height="50" rx="4" fill="white" fillOpacity="0.04" stroke="white" strokeOpacity="0.08" strokeWidth="0.75" />
      {/* Shackle */}
      <path d="M32 50 L32 35 C32 22 42 14 50 14 C58 14 68 22 68 35 L68 50" stroke="white" strokeOpacity="0.1" strokeWidth="0.75" fill="none" />
      {/* Keyhole */}
      <circle cx="50" cy="70" r="6" fill="#C8442C" fillOpacity="0.2" stroke="#C8442C" strokeOpacity="0.3" strokeWidth="0.5" />
      <line x1="50" y1="76" x2="50" y2="90" stroke="#C8442C" strokeOpacity="0.3" strokeWidth="0.5" />
      {/* Circuit traces */}
      <line x1="0" y1="75" x2="20" y2="75" stroke="#8ED7A3" strokeOpacity="0.15" strokeWidth="0.5" />
      <line x1="80" y1="75" x2="100" y2="75" stroke="#8ED7A3" strokeOpacity="0.15" strokeWidth="0.5" />
      <line x1="50" y1="100" x2="50" y2="120" stroke="#8ED7A3" strokeOpacity="0.1" strokeWidth="0.5" />
    </svg>
  );
}

/** Eye scan — used in Detection service */
export function EyeScan({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className}>
      {/* Eye shape */}
      <path d="M10 40 C10 40 35 10 60 10 C85 10 110 40 110 40 C110 40 85 70 60 70 C35 70 10 40 10 40 Z" stroke="#C8442C" strokeWidth="0.75" strokeOpacity="0.4" fill="none" />
      {/* Iris */}
      <circle cx="60" cy="40" r="16" stroke="#C8442C" strokeWidth="0.5" strokeOpacity="0.3" fill="#C8442C" fillOpacity="0.05" />
      {/* Pupil */}
      <circle cx="60" cy="40" r="6" fill="#C8442C" fillOpacity="0.15" stroke="#C8442C" strokeOpacity="0.4" strokeWidth="0.5" />
      {/* Scan line */}
      <line x1="10" y1="40" x2="110" y2="40" stroke="#8ED7A3" strokeOpacity="0.15" strokeWidth="0.5" strokeDasharray="2 2" />
    </svg>
  );
}
