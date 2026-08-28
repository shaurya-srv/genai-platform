"use client";

import React from "react";
import { useRouter } from "next/navigation";

const PORTALS = [
  {
    id: "operator",
    name: "Operator",
    icon: "📝",
    color: "#3b82f6",
    description: "Submit source content, select output types, trigger generation, edit drafts",
    permissions: ["Submit content", "Select outputs", "Edit drafts", "View results"],
    loginRoute: "/login?portal=operator",
  },
  {
    id: "approver",
    name: "Reviewer / Approver",
    icon: "✍️",
    color: "#10b981",
    description: "Review pending generations, digitally sign, approve or reject with comments",
    permissions: ["Review content", "Approve/Reject", "Add comments", "Digital signatures"],
    loginRoute: "/login?portal=approver",
  },
  {
    id: "admin",
    name: "Administrator",
    icon: "🖥️",
    color: "#f97316",
    description: "Manage users, assign roles, view audit trail, configure templates, revoke access",
    permissions: ["Manage users", "Assign roles", "Audit trail", "System config"],
    loginRoute: "/login?portal=admin",
  },
  {
    id: "auditor",
    name: "Auditor",
    icon: "🔍",
    color: "#8b5cf6",
    description: "Read-only access to the full hash-chain ledger and logs for verification",
    permissions: ["View ledger", "Verify chain", "Export logs", "Read-only access"],
    loginRoute: "/login?portal=auditor",
  },
];

const FEATURES = [
  { icon: "⚡", title: "Multi-Format Generation", desc: "Transform one source into LinkedIn, Twitter, Advisory, Executive Summary, Presentation, Infographic, Video, and Crisis Response" },
  { icon: "⛓️", title: "Hash-Chain Ledger", desc: "Every event cryptographically chained with SHA-256 prev_hash linking and per-user RSA keypair signatures" },
  { icon: "🔐", title: "RBAC + MFA", desc: "4-portal access control with role-based permissions and TOTP-based two-factor authentication" },
  { icon: "🛡️", title: "Security Pipeline", desc: "DLP scanning, threat analysis, compliance checking, and prompt injection defense before any generation" },
  { icon: "✍️", title: "Multi-Signature Approval", desc: "Separation of duties enforced — submitters cannot self-approve. Configurable thresholds per output type" },
  { icon: "📤", title: "SIEM Integration", desc: "Audit logs exportable in CEF, JSON, CSV, and Syslog formats for ArcSight, QRadar, Splunk, and Elasticsearch" },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0a0e1a 0%, #111827 40%, #0f172a 100%)" }}>
      {/* Hero */}
      <header style={{ padding: "2rem 2rem 0", maxWidth: "1200px", margin: "0 auto" }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.75rem" }}>🛡️</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              NTRO GenAI Platform
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => router.push("/login")}
              style={{
                padding: "0.6rem 1.5rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.05)", color: "#d1d5db", fontSize: "0.85rem", fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => router.push("/login?portal=operator")}
              style={{
                padding: "0.6rem 1.5rem", borderRadius: "10px", border: "none",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff",
                fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
              }}
            >
              Get Started →
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div style={{ textAlign: "center", padding: "2rem 0 4rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", borderRadius: "20px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.75rem" }}>🇮🇳</span>
            <span style={{ fontSize: "0.75rem", color: "#93c5fd", fontWeight: 600 }}>Smart India Hackathon 2.0 — Blockchain & Cybersecurity</span>
          </div>
          <h1 style={{ fontSize: "3.5rem", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.5rem", maxWidth: "800px", margin: "0 auto 1.5rem" }}>
            <span style={{ background: "linear-gradient(135deg, #f3f4f6, #d1d5db)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              AI-Powered Content
            </span>
            <br />
            <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Transformation Platform
            </span>
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#9ca3af", maxWidth: "600px", margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
            Securely transform source content into multiple communication formats with blockchain-verified provenance, multi-signature approval, and full audit trail.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <button
              onClick={() => router.push("/login?portal=operator")}
              style={{
                padding: "0.85rem 2rem", borderRadius: "12px", border: "none",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff",
                fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                boxShadow: "0 8px 30px rgba(59,130,246,0.3)",
              }}
            >
              🚀 Launch Platform
            </button>
            <button
              onClick={() => router.push("/verify")}
              style={{
                padding: "0.85rem 2rem", borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)",
                color: "#d1d5db", fontSize: "1rem", fontWeight: 600, cursor: "pointer",
              }}
            >
              🔍 Verify Content
            </button>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem 4rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, textAlign: "center", marginBottom: "0.5rem", color: "#f3f4f6" }}>
          Platform Capabilities
        </h2>
        <p style={{ textAlign: "center", color: "#9ca3af", marginBottom: "2.5rem", fontSize: "0.9rem" }}>
          Built for intelligence organizations handling sensitive content requiring secure, auditable transformation
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              padding: "1.5rem", borderRadius: "14px", background: "rgba(17,24,39,0.8)",
              border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.2s",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{f.icon}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f3f4f6", marginBottom: "0.4rem" }}>{f.title}</h3>
              <p style={{ fontSize: "0.8rem", color: "#9ca3af", lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portal Access */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem 4rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, textAlign: "center", marginBottom: "0.5rem", color: "#f3f4f6" }}>
          Role-Based Portals
        </h2>
        <p style={{ textAlign: "center", color: "#9ca3af", marginBottom: "2.5rem", fontSize: "0.9rem" }}>
          Four distinct login portals with separate JWT scopes, permissions, and dashboards
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {PORTALS.map((portal) => (
            <div
              key={portal.id}
              onClick={() => router.push(portal.loginRoute)}
              style={{
                padding: "1.5rem", borderRadius: "14px", cursor: "pointer",
                background: "rgba(17,24,39,0.8)", border: `1px solid ${portal.color}20`,
                transition: "all 0.25s", position: "relative", overflow: "hidden",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = portal.color; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${portal.color}15`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${portal.color}20`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{portal.icon}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: portal.color, marginBottom: "0.4rem" }}>{portal.name}</h3>
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.75rem", lineHeight: 1.4 }}>{portal.description}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                {portal.permissions.map((perm, i) => (
                  <div key={i} style={{ fontSize: "0.65rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ color: portal.color }}>✓</span> {perm}
                  </div>
                ))}
              </div>
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "3px",
                background: `linear-gradient(90deg, ${portal.color}, transparent)`,
              }} />
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem 4rem" }}>
        <div style={{
          padding: "2rem", borderRadius: "16px", background: "rgba(17,24,39,0.8)",
          border: "1px solid rgba(255,255,255,0.06)", textAlign: "center",
        }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f3f4f6", marginBottom: "1rem" }}>Built With</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
            {[
              { label: "Next.js 16", icon: "⚛️" },
              { label: "TypeScript", icon: "📘" },
              { label: "SHA-256 Hash Chain", icon: "⛓️" },
              { label: "TOTP MFA", icon: "🔐" },
              { label: "RSA Keypairs", icon: "🔑" },
              { label: "Plugin Architecture", icon: "🧩" },
            ].map((tech, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>{tech.icon}</span>
                <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{tech.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem 2rem",
        textAlign: "center", color: "#6b7280", fontSize: "0.75rem",
      }}>
        NTRO GenAI Platform • Blockchain & Cybersecurity • Smart India Hackathon 2.0
      </footer>
    </div>
  );
}
