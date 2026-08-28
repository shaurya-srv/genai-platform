"use client";

import React from "react";
import { useRouter } from "next/navigation";

const NTRO_SECTIONS = [
  { id: "transform", icon: "🤖", title: "Transformation AI", desc: "Transform any source — text, URL, voice, PPT, PDF, files — into multiple communication formats: LinkedIn, Twitter/X, advisories, presentations, infographics, video scripts, and more.", color: "#3b82f6", features: ["Multi-source ingestion", "8+ output formats", "Context-aware generation", "Parallel transformation"] },
  { id: "approval", icon: "✍️", title: "Multi-Sign Approval", desc: "Every transformation goes through a rigorous multi-signature approval chain before publication. Submitters cannot self-approve — separation of duties enforced.", color: "#10b981", features: ["Separation of duties", "Multi-signature required", "Role-based reviewers", "Audit trail"] },
  { id: "analysis", icon: "📊", title: "Analysis & Review", desc: "Comprehensive analysis: consistency scoring, source grounding validation, quality metrics, and detailed review dashboards.", color: "#06b6d4", features: ["Consistency scoring", "Source validation", "Quality metrics", "Review dashboards"] },
  { id: "threat", icon: "🔍", title: "Threat Analysis", desc: "Advanced threat analysis engine scanning content for misinformation, adversarial manipulation, and security risks. STIX/TAXII-compatible.", color: "#ef4444", features: ["Misinformation detection", "Adversarial analysis", "STIX/TAXII output", "Risk scoring"] },
  { id: "compliance", icon: "📋", title: "Compliance Check", desc: "Automated compliance verification against DPDP Act, GDPR, IT Act, and organizational policies.", color: "#f59e0b", features: ["DPDP Act checks", "GDPR compliance", "IT Act alignment", "Policy enforcement"] },
  { id: "dlp", icon: "🛡️", title: "DLP Scanner", desc: "Data Loss Prevention scanning ensures no classified, sensitive, or restricted information leaks into generated content.", color: "#8b5cf6", features: ["Real-time scanning", "PII detection", "Auto-redaction", "Classification tags"] },
  { id: "incident", icon: "🚨", title: "Incident Response Chain", desc: "Structured incident response workflow for cyber attacks, data breaches, and security events. Cascading order flow from senior leadership.", color: "#ec4899", features: ["Cascading orders", "Response playbooks", "Timeline tracking", "Escalation chains"] },
  { id: "linkage", icon: "🔗", title: "External Linkage", desc: "Link organizational mail, LinkedIn, and X (Twitter) for direct publication after validation. Post-status tracking and cross-platform sync.", color: "#0ea5e9", features: ["Email integration", "LinkedIn posting", "X/Twitter threads", "Status tracking"] },
];
const HIERARCHY = [
  { level: "Level 1", title: "Executive & Scientific Leadership", roles: "Chairman, Distinguished Scientist, Outstanding Scientist", color: "#ec4899", icon: "🏛️", access: "Full system access — final approval authority, system configuration, all sections" },
  { level: "Level 2", title: "Senior Management", roles: "Scientist G (Senior Directors), F (Joint Scientist), E (Deputy Scientist)", color: "#f59e0b", icon: "👔", access: "Approve/reject content, manage teams, view analytics, access all operational sections" },
  { level: "Level 3", title: "Middle Management", roles: "D (Senior Technical Leads, Project Leaders), C (Operational Managers)", color: "#3b82f6", icon: "📋", access: "Approve lower-level submissions, manage projects, view dashboards and reports" },
  { level: "Level 4", title: "General Scientists & Workers", roles: "All operational scientists, technical staff, support personnel", color: "#10b981", icon: "🔬", access: "Submit content, view own submissions, request approval, view assigned sections" },
];
export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #020617 0%, #0f172a 30%, #1e1b4b 70%, #0f172a 100%)", color: "#e2e8f0" }}>
      {/* Sticky Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px)", background: "rgba(2,6,23,0.8)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>{"🛡️"}</div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f1f5f9" }}>NTRO GenAI Platform</div>
              <div style={{ fontSize: "0.65rem", color: "#64748b", letterSpacing: "0.1em" }}>NATIONAL TECHNICAL RESEARCH ORGANISATION</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button onClick={() => router.push("/verify")} style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>{"🔍"} Verify</button>
            <button onClick={() => router.push("/login")} style={{ padding: "0.5rem 1.25rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#d1d5db", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>Sign In</button>
            <button onClick={() => router.push("/login")} style={{ padding: "0.5rem 1.25rem", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>Get Started</button>
          </div>
        </div>
      </nav>
      {/* Hero */}
      <header style={{ maxWidth: "1200px", margin: "0 auto", padding: "6rem 2rem 4rem", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", borderRadius: 20, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", marginBottom: "2rem" }}>
          <span>{"🇮🇳"}</span>
          <span style={{ fontSize: "0.8rem", color: "#93c5fd", fontWeight: 600 }}>Smart India Hackathon 2.0</span>
        </div>
        <h1 style={{ fontSize: "3.5rem", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.5rem" }}>
          <span style={{ background: "linear-gradient(135deg, #f1f5f9, #cbd5e1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI-Powered Content </span>
          <br />
          <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Transformation Platform</span>
        </h1>
        <p style={{ fontSize: "1.15rem", color: "#94a3b8", maxWidth: "700px", margin: "0 auto 2rem", lineHeight: 1.7 }}>
          A secure, auditable AI platform for transforming intelligence content into multiple communication formats with blockchain-verified provenance, multi-signature approval, and full regulatory compliance.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/login")} style={{ padding: "0.85rem 2rem", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", fontSize: "1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 30px rgba(59,130,246,0.3)" }}>{"🚀"} Access Platform</button>
          <button onClick={() => router.push("/login")} style={{ padding: "0.85rem 2rem", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#d1d5db", fontSize: "1rem", fontWeight: 600, cursor: "pointer" }}>{"🔐"} Secure Login</button>
        </div>
        <div style={{ marginTop: "3rem", display: "flex", justifyContent: "center", gap: "3rem", flexWrap: "wrap" }}>
          {[{ l: "Source Formats", v: "8+", i: "📄" }, { l: "Output Types", v: "8+", i: "⚡" }, { l: "Security Layers", v: "7", i: "🛡️" }, { l: "Approval Sigs", v: "Multi", i: "✍️" }].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f1f5f9" }}>{s.i} {s.v}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </header>
      {/* 8 Platform Modules */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.5rem" }}>Platform Modules</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>Eight integrated modules powering the complete content lifecycle</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {NTRO_SECTIONS.map((sec) => (
            <div key={sec.id} onClick={() => router.push("/login")} style={{ padding: "1.75rem", borderRadius: 16, background: "rgba(15,23,42,0.8)", border: "1px solid " + sec.color + "20", cursor: "pointer", transition: "all 0.3s", position: "relative", overflow: "hidden" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = sec.color; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px " + sec.color + "15"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = sec.color + "20"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ fontSize: "2.25rem", marginBottom: "1rem" }}>{sec.icon}</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: sec.color, marginBottom: "0.5rem" }}>{sec.title}</h3>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "1rem" }}>{sec.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {sec.features.map((f, i) => (
                  <span key={i} style={{ fontSize: "0.65rem", padding: "0.2rem 0.6rem", borderRadius: 6, background: sec.color + "15", color: sec.color, fontWeight: 600 }}>{f}</span>
                ))}
              </div>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, " + sec.color + ", transparent)" }} />
            </div>
          ))}
        </div>
      </section>
      {/* Security Hierarchy */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.5rem" }}>Security Access Hierarchy</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>Four-tier access control aligned with NTRO organizational structure</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {HIERARCHY.map((h, i) => (
            <div key={i} style={{ padding: "1.5rem 2rem", borderRadius: 14, background: "rgba(15,23,42,0.8)", border: "1px solid " + h.color + "25", display: "flex", alignItems: "center", gap: "1.5rem", transition: "all 0.25s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = h.color; e.currentTarget.style.boxShadow = "0 4px 20px " + h.color + "10"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = h.color + "25"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: h.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", flexShrink: 0 }}>{h.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: 4, background: h.color + "20", color: h.color, fontWeight: 700 }}>{h.level}</span>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f1f5f9" }}>{h.title}</h3>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.25rem" }}>{h.roles}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{h.access}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem" }}>
        <div style={{ padding: "2.5rem", borderRadius: 20, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9", textAlign: "center", marginBottom: "2rem" }}>Platform Architecture</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}>
            {[{ icon: "⚛️", label: "Next.js 16", desc: "Full-stack React framework" }, { icon: "📘", label: "TypeScript", desc: "Type-safe codebase" }, { icon: "⛓️", label: "SHA-256 Chain", desc: "Tamper-evident ledger" }, { icon: "🔑", label: "RSA Keypairs", desc: "Per-user cryptographic signing" }, { icon: "🔐", label: "TOTP MFA", desc: "Two-factor authentication" }, { icon: "🧩", label: "Plugin System", desc: "Extensible output types" }, { icon: "📤", label: "SIEM Export", desc: "CEF, JSON, CSV, Syslog" }, { icon: "🌐", label: "Google OAuth", desc: "Enterprise SSO login" }].map((t, i) => (
              <div key={i} style={{ textAlign: "center", padding: "1rem" }}>
                <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{t.icon}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0" }}>{t.label}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>NTRO GenAI Platform • Secure Content Transformation</div>
        <div style={{ fontSize: "0.7rem", color: "#475569" }}>Blockchain & Cybersecurity • Smart India Hackathon 2.0</div>
      </footer>
    </div>
  );
}