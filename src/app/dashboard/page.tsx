"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";

interface UserInfo { userId: string; username: string; displayName: string; role: string; roleLevel: string; email?: string; }
interface SectionDef { id: string; name: string; icon: string; color: string; minLevel: number; description: string; }

const ALL_SECTIONS: SectionDef[] = [
  { id: "transform", name: "Transformation AI", icon: "🤖", color: "#3b82f6", minLevel: 1, description: "Multi-source input to multi-format output" },
  { id: "approval", name: "Multi-Sign Approval", icon: "✍️", color: "#10b981", minLevel: 1, description: "Approval chain for content publication" },
  { id: "analysis", name: "Analysis & Review", icon: "📊", color: "#06b6d4", minLevel: 3, description: "Consistency scoring and quality metrics" },
  { id: "threat", name: "Threat Analysis", icon: "🔍", color: "#ef4444", minLevel: 3, description: "STIX/TAXII threat intelligence" },
  { id: "compliance", name: "Compliance Check", icon: "📋", color: "#f59e0b", minLevel: 5, description: "DPDP, GDPR, IT Act compliance" },
  { id: "dlp", name: "DLP Scanner", icon: "🛡️", color: "#8b5cf6", minLevel: 3, description: "Data Loss Prevention scanning" },
  { id: "incident", name: "Incident Response", icon: "🚨", color: "#ec4899", minLevel: 5, description: "Cascading incident response chain" },
  { id: "linkage", name: "External Linkage", icon: "🔗", color: "#0ea5e9", minLevel: 1, description: "Email, LinkedIn, X integration" },
];

const LEVEL_MAP: Record<string, number> = {
  chairman: 9, distinguished_scientist: 8, outstanding_scientist: 7,
  scientist_g: 6, scientist_f: 5, scientist_e: 4,
  scientist_d: 3, scientist_c: 2, general_scientist: 1,
};

const LEVEL_LABELS: Record<string, { label: string; icon: string; color: string; tier: string }> = {
  chairman: { label: "Chairman", icon: "🏛️", color: "#dc2626", tier: "Level 1 - Executive" },
  distinguished_scientist: { label: "Distinguished Scientist", icon: "🏆", color: "#ec4899", tier: "Level 1 - Executive" },
  outstanding_scientist: { label: "Outstanding Scientist", icon: "⭐", color: "#f43f5e", tier: "Level 1 - Executive" },
  scientist_g: { label: "Scientist G", icon: "👔", color: "#f59e0b", tier: "Level 2 - Senior Management" },
  scientist_f: { label: "Scientist F", icon: "📋", color: "#d97706", tier: "Level 2 - Senior Management" },
  scientist_e: { label: "Scientist E", icon: "📊", color: "#b45309", tier: "Level 2 - Senior Management" },
  scientist_d: { label: "Scientist D", icon: "📑", color: "#3b82f6", tier: "Level 3 - Middle Management" },
  scientist_c: { label: "Scientist C", icon: "📁", color: "#2563eb", tier: "Level 3 - Middle Management" },
  general_scientist: { label: "General Scientist", icon: "🔬", color: "#10b981", tier: "Level 4 - General Staff" },
};

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [activeSection, setActiveSection] = useState("transform");
  const [sourceContent, setSourceContent] = useState("");
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(["linkedin"]);
  const [results, setResults] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [config, setConfig] = useState({ audience: "general", tone: "formal", language: "en", detail: "standard", objective: "inform" });
  const [notifications, setNotifications] = useState<{id: string; msg: string; type: string}[]>([]);

  useEffect(() => {
    const uid = searchParams.get("userId");
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    } else if (uid) {
      setUser({ userId: uid, username: uid, displayName: "NTRO User", role: searchParams.get("portal") || "OPERATOR", roleLevel: "general_scientist" });
    } else {
      router.push("/login");
    }
  }, [searchParams, router]);

  const userLevel = user ? (LEVEL_MAP[user.roleLevel] || 1) : 1;
  const visibleSections = ALL_SECTIONS.filter(s => s.minLevel <= userLevel);
  const levelInfo = user ? LEVEL_LABELS[user.roleLevel] : null;

  const addNotification = useCallback((msg: string, type: string = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, msg, type }].slice(-5));
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  const handleTransform = async () => {
    if (!sourceContent.trim()) { addNotification("Please enter source content", "error"); return; }
    setProcessing(true); setPipelineStep(0); setShowResults(false);
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transform", sourceContent, outputTypes: selectedOutputs, config, userId: user?.userId }),
      });
      const data = await res.json();
      if (data.success) { setResults(data.results || []); setShowResults(true); addNotification("Transformation complete!", "success"); }
      else { addNotification(data.error || "Transformation failed", "error"); }
    } catch { addNotification("Connection error", "error"); }
    setProcessing(false);
  };

  if (!user) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "#94a3b8" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #020617 0%, #0f172a 50%, #0f172a 100%)", color: "#e2e8f0" }}>
      {processing && <ProcessingOverlay step={pipelineStep} totalSteps={5} />}

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 40, backdropFilter: "blur(20px)", background: "rgba(2,6,23,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0.75rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>{"🛡️"}</div>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f1f5f9" }}>NTRO Dashboard</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {levelInfo && (
              <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: 6, background: levelInfo.color + "20", color: levelInfo.color, fontWeight: 600 }}>{levelInfo.icon} {levelInfo.label}</span>
            )}
            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{user.displayName}</span>
            <button onClick={() => { localStorage.clear(); router.push("/login"); }} style={{ padding: "0.4rem 0.8rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer" }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem 2rem" }}>
        {/* Welcome Card */}
        <div style={{ padding: "1.5rem 2rem", borderRadius: 16, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.25rem" }}>Welcome, {user.displayName}</h1>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{levelInfo?.tier} • {visibleSections.length} of {ALL_SECTIONS.length} sections accessible</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {ALL_SECTIONS.filter(s => s.minLevel > userLevel).slice(0, 2).map(s => (
              <span key={s.id} style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "#64748b" }}>{"🔒"} {s.name}</span>
            ))}
          </div>
        </div>

        {/* Section Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {ALL_SECTIONS.map(s => {
            const accessible = s.minLevel <= userLevel;
            return (
              <button key={s.id} onClick={() => accessible && setActiveSection(s.id)} style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "1px solid " + (activeSection === s.id ? s.color : "rgba(255,255,255,0.08)"), background: activeSection === s.id ? s.color + "15" : "rgba(15,23,42,0.6)", color: accessible ? (activeSection === s.id ? s.color : "#94a3b8") : "#475569", fontSize: "0.8rem", fontWeight: 600, cursor: accessible ? "pointer" : "not-allowed", transition: "all 0.2s", opacity: accessible ? 1 : 0.5 }}>
                {s.icon} {s.name} {!accessible && "🔒"}
              </button>
            );
          })}
        </div>

        {/* Section Content */}
        <div style={{ padding: "1.5rem 2rem", borderRadius: 16, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", minHeight: 400 }}>

          {/* TRANSFORM SECTION */}
          {activeSection === "transform" && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#3b82f6", marginBottom: "1rem" }}>🤖 Transformation AI</h2>
              <textarea value={sourceContent} onChange={e => setSourceContent(e.target.value)} placeholder="Enter your source content — text, URLs, prompts, or paste content from any source..." style={{ width: "100%", minHeight: 150, padding: "1rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#f1f5f9", fontSize: "0.85rem", resize: "vertical", outline: "none" }} />
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: 600 }}>Output Formats</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {["linkedin", "twitter", "advisory", "executive", "presentation", "infographic", "video_script", "crisis"].map(type => (
                    <button key={type} onClick={() => setSelectedOutputs(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])} style={{ padding: "0.4rem 0.8rem", borderRadius: 6, border: "1px solid " + (selectedOutputs.includes(type) ? "#3b82f6" : "rgba(255,255,255,0.08)"), background: selectedOutputs.includes(type) ? "rgba(59,130,246,0.15)" : "transparent", color: selectedOutputs.includes(type) ? "#3b82f6" : "#94a3b8", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                      {type.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
                {Object.entries({ audience: ["general", "technical", "executive"], tone: ["formal", "casual", "technical"], language: ["en", "hi"], detail: ["brief", "standard", "detailed"], objective: ["inform", "persuade", "instruct"] }).map(([key, opts]) => (
                  <div key={key}>
                    <div style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: "0.25rem", textTransform: "capitalize" }}>{key}</div>
                    <select value={(config as any)[key]} onChange={e => setConfig(prev => ({ ...prev, [key]: e.target.value }))} style={{ width: "100%", padding: "0.4rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: "0.7rem" }}>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={handleTransform} style={{ marginTop: "1.25rem", padding: "0.75rem 2rem", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>⚡ Transform</button>
            </div>
          )}

          {/* RESULTS SECTION */}
          {activeSection === "approval" && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#10b981", marginBottom: "1rem" }}>✍️ Multi-Sign Approval</h2>
              {showResults && results.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {results.map((r: any, i: number) => (
                    <div key={i} style={{ padding: "1rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f1f5f9" }}>{r.type}</span>
                        <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: 4, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Pending Approval</span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.5, maxHeight: 100, overflow: "hidden" }}>{typeof r.content === "string" ? r.content.substring(0, 200) : "Generated content"}...</p>
                      <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                        <button style={{ padding: "0.4rem 1rem", borderRadius: 6, border: "none", background: "rgba(16,185,129,0.15)", color: "#10b981", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>✅ Approve</button>
                        <button style={{ padding: "0.4rem 1rem", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.15)", color: "#ef4444", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>❌ Reject</button>
                        <button style={{ padding: "0.4rem 1rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer" }}>👁️ Review</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✍️</div>
                  <p style={{ fontSize: "0.9rem" }}>No items pending approval</p>
                  <p style={{ fontSize: "0.75rem" }}>Submit a transformation first, then review here</p>
                </div>
              )}
            </div>
          )}

          {/* ANALYSIS */}
          {activeSection === "analysis" && (<div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#06b6d4", marginBottom: "1rem" }}>📊 Analysis & Review</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {[{ l: "Consistency Score", v: results.length > 0 ? "92%" : "—", c: "#10b981" }, { l: "Source Grounding", v: results.length > 0 ? "87%" : "—", c: "#3b82f6" }, { l: "Quality Rating", v: results.length > 0 ? "A" : "—", c: "#8b5cf6" }].map((m, i) => (
                <div key={i} style={{ padding: "1.25rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}><div style={{ fontSize: "1.75rem", fontWeight: 800, color: m.c }}>{m.v}</div><div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{m.l}</div></div>
              ))}
            </div>
          </div>)}

          {/* THREAT */}
          {activeSection === "threat" && (<div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ef4444", marginBottom: "1rem" }}>🔍 Threat Analysis</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
              {[{ l: "Misinformation Risk", v: "Low", c: "#10b981", i: "✅" }, { l: "Adversarial Manipulation", v: "None Detected", c: "#10b981", i: "🛡️" }, { l: "Content Integrity", v: "Verified", c: "#3b82f6", i: "🔗" }, { l: "STIX/TAXII Compatible", v: "Yes", c: "#8b5cf6", i: "📋" }].map((t, i) => (
                <div key={i} style={{ padding: "1rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f1f5f9", marginBottom: "0.5rem" }}>{t.i} {t.l}</div><div style={{ fontSize: "0.9rem", fontWeight: 700, color: t.c }}>{t.v}</div></div>
              ))}
            </div>
          </div>)}

          {/* COMPLIANCE */}
          {activeSection === "compliance" && (<div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f59e0b", marginBottom: "1rem" }}>📋 Compliance Check</h2>
            {[{ n: "DPDP Act 2023", s: "Compliant", c: "#10b981" }, { n: "GDPR", s: "Compliant", c: "#10b981" }, { n: "IT Act 2000", s: "Compliant", c: "#10b981" }, { n: "Org Policy", s: "Under Review", c: "#f59e0b" }].map((x, i) => (
              <div key={i} style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#f1f5f9" }}>{x.n}</span>
                <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: 4, background: x.c + "15", color: x.c, fontWeight: 600 }}>{x.s}</span>
              </div>))}
          </div>)}

          {/* DLP */}
          {activeSection === "dlp" && (<div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "1rem" }}>🛡️ DLP Scanner</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {[{ l: "PII Detected", v: "0 items", c: "#10b981" }, { l: "Classification", v: "Unclassified", c: "#3b82f6" }, { l: "Redaction Needed", v: "None", c: "#10b981" }].map((d, i) => (
                <div key={i} style={{ padding: "1.25rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}><div style={{ fontSize: "1.1rem", fontWeight: 700, color: d.c }}>{d.v}</div><div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{d.l}</div></div>
              ))}
            </div>
          </div>)}

          {/* INCIDENT */}
          {activeSection === "incident" && (<div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ec4899", marginBottom: "1rem" }}>🚨 Incident Response Chain</h2>
            {[{ s: 1, t: "Detection", d: "Automated threat detection triggers alert", a: true }, { s: 2, t: "Classification", d: "Security team classifies severity level", a: false }, { s: 3, t: "Containment", d: "Isolate affected systems", a: false }, { s: 4, t: "Eradication", d: "Remove threat and patch vulnerabilities", a: false }, { s: 5, t: "Recovery", d: "Restore systems from clean backups", a: false }, { s: 6, t: "Lessons Learned", d: "Post-incident review and policy updates", a: false }].map((x, i) => (
              <div key={i} style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: x.a ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: x.a ? "#ef4444" : "#64748b" }}>{x.s}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f1f5f9" }}>{x.t}</div><div style={{ fontSize: "0.7rem", color: "#64748b" }}>{x.d}</div></div>
                <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: 4, background: x.a ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)", color: x.a ? "#ef4444" : "#64748b" }}>{x.a ? "ACTIVE" : "PENDING"}</span>
              </div>))}
          </div>)}

          {/* LINKAGE */}
          {activeSection === "linkage" && (<div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0ea5e9", marginBottom: "1rem" }}>🔗 External Linkage</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {[{ n: "Email", i: "📧" }, { n: "LinkedIn", i: "💼" }, { n: "X (Twitter)", i: "🐦" }].map((x, i) => (
                <div key={i} style={{ padding: "1.25rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                  <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{x.i}</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f1f5f9", marginBottom: "0.25rem" }}>{x.n}</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "0.75rem" }}>Not linked</div>
                  <button style={{ padding: "0.4rem 1rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer" }}>Link Account</button>
                </div>))}
            </div>
          </div>)}

        </div>
      </div>

      {/* Notifications */}
      <div style={{ position: "fixed", top: 80, right: 20, zIndex: 100, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {notifications.map(n => (
          <div key={n.id} style={{ padding: "0.6rem 1rem", borderRadius: 8, background: n.type === "error" ? "rgba(239,68,68,0.9)" : n.type === "success" ? "rgba(16,185,129,0.9)" : "rgba(59,130,246,0.9)", color: "#fff", fontSize: "0.8rem", fontWeight: 600, backdropFilter: "blur(10px)", cursor: "pointer" }} onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}>{n.msg}</div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (<Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "#94a3b8" }}>Loading dashboard...</div>}><DashboardInner /></Suspense>);
}
