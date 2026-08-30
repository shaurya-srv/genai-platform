"use client";

import React, { useState, useEffect } from "react";

// ==================== TYPES ====================

interface LoginAttempt {
  userId: string;
  timestamp: number;
  success: boolean;
  portal: string;
  ip: string;
}

interface AuditRecord {
  id: string;
  timestamp: number;
  eventType: string;
  actor: string;
  actorRole: string;
  targetId: string;
  targetType: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress: string;
  riskLevel: "INFO" | "LOW" | "MEDIUM" | "HIGH";
}

interface Stats {
  totalUsers: number;
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  loginsLast24h: number;
  totalAuditEvents: number;
  highRiskEvents: number;
  uniqueActors: number;
  alerts: AuditRecord[];
}

interface User {
  userId: string;
  username: string;
  displayName: string;
  email?: string;
  role: string;
  roleLevel: string;
  googleEmail?: string;
  authProvider: string;
  lastLogin: number;
  active: boolean;
}

// ==================== HELPERS ====================

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const RISK_COLORS: Record<string, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#3b82f6",
  INFO: "#64748b",
};

const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  chairman: { label: "L1 Executive", color: "#dc2626" },
  distinguished_scientist: { label: "L1 Executive", color: "#ec4899" },
  outstanding_scientist: { label: "L1 Executive", color: "#f43f5e" },
  scientist_g: { label: "L2 Senior", color: "#f59e0b" },
  scientist_f: { label: "L2 Senior", color: "#d97706" },
  scientist_e: { label: "L2 Senior", color: "#b45309" },
  scientist_d: { label: "L3 Middle", color: "#3b82f6" },
  scientist_c: { label: "L3 Middle", color: "#2563eb" },
  general_scientist: { label: "L4 General", color: "#10b981" },
};

// ==================== COMPONENT ====================

const LEVEL_OPTIONS = [
  { value: "chairman", label: "L1 — Chairman" },
  { value: "distinguished_scientist", label: "L1 — Distinguished Scientist" },
  { value: "outstanding_scientist", label: "L1 — Outstanding Scientist" },
  { value: "scientist_g", label: "L2 — Scientist G" },
  { value: "scientist_f", label: "L2 — Scientist F" },
  { value: "scientist_e", label: "L2 — Scientist E" },
  { value: "scientist_d", label: "L3 — Scientist D" },
  { value: "scientist_c", label: "L3 — Scientist C" },
  { value: "general_scientist", label: "L4 — General Scientist" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<"overview" | "logins" | "activity" | "users">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [logins, setLogins] = useState<LoginAttempt[]>([]);
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // Auth guard: check if user is logged in as ADMIN
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("auth_session") || "{}");
    if (!session.token || session.role !== "ADMIN") {
      setAuthError("Access denied. ADMIN role required.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${session.token}` };
        const [statsRes, loginsRes, auditRes, usersRes] = await Promise.all([
          fetch("/api/admin?section=stats", { headers }),
          fetch("/api/admin?section=login_history", { headers }),
          fetch("/api/admin?section=audit_trail", { headers }),
          fetch("/api/admin?section=users", { headers }),
        ]);
        if (statsRes.status === 403) { setAuthError("Access denied. ADMIN role required."); return; }
        if (statsRes.ok) setStats(await statsRes.json());
        if (loginsRes.ok) setLogins(await loginsRes.json());
        if (auditRes.ok) setAudit(await auditRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
      } catch (e) {
        console.error("Failed to load admin data", e);
      }
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePromote = async (userId: string, newLevel: string) => {
    const session = JSON.parse(localStorage.getItem("auth_session") || "{}" );
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ action: "promote", userId, newRoleLevel: newLevel }),
    });
    // Refresh users
    const res = await fetch("/api/admin?section=users", { headers: { Authorization: `Bearer ${session.token}` } });
    if (res.ok) setUsers(await res.json());
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    const session = JSON.parse(localStorage.getItem("auth_session") || "{}" );
    const action = currentActive ? "deactivate" : "activate";
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ action, userId }),
    });
    const res = await fetch("/api/admin?section=users", { headers: { Authorization: `Bearer ${session.token}` } });
    if (res.ok) setUsers(await res.json());
  };

  if (authError) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "#ef4444", flexDirection: "column", gap: "1rem" }}>
        <div style={{ fontSize: "2rem" }}>🔒</div>
        <div style={{ fontSize: "1rem", fontWeight: 600 }}>{authError}</div>
        <a href="/login" style={{ color: "#3b82f6", fontSize: "0.85rem" }}>← Back to Login</a>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "#94a3b8" }}>
        Loading admin panel...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #020617 0%, #0f172a 100%)", color: "#e2e8f0", padding: "2rem" }}>
      {/* Header */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #f97316, #ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🛡️</div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Admin Control Panel</h1>
            <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Who logged in, who did what</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          {(["overview", "logins", "activity", "users"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: 10,
                border: "none",
                background: tab === t ? "linear-gradient(135deg, #f97316, #ef4444)" : "rgba(255,255,255,0.05)",
                color: tab === t ? "#fff" : "#94a3b8",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {t === "overview" && "📊 "}
              {t === "logins" && "🔑 "}
              {t === "activity" && "📋 "}
              {t === "users" && "👥 "}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ========== OVERVIEW ========== */}
        {tab === "overview" && stats && (
          <div>
            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "#3b82f6" },
                { label: "Successful Logins", value: stats.successfulLogins, icon: "✅", color: "#10b981" },
                { label: "Failed Logins", value: stats.failedLogins, icon: "❌", color: "#ef4444" },
                { label: "Logins (24h)", value: stats.loginsLast24h, icon: "🕐", color: "#f59e0b" },
                { label: "Audit Events", value: stats.totalAuditEvents, icon: "📋", color: "#8b5cf6" },
                { label: "High Risk Events", value: stats.highRiskEvents, icon: "⚠️", color: "#ef4444" },
              ].map((card) => (
                <div key={card.label} style={{ padding: "1.25rem", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{card.icon}</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{card.label}</span>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: card.color }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Alerts */}
            {stats.alerts.length > 0 && (
              <div style={{ padding: "1rem", borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#ef4444", margin: "0 0 0.75rem" }}>⚠️ Active Alerts ({stats.alerts.length})</h3>
                {stats.alerts.slice(0, 5).map((a) => (
                  <div key={a.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(239,68,68,0.1)", fontSize: "0.8rem", color: "#fca5a5" }}>
                    {a.action} — {timeAgo(a.timestamp)}
                  </div>
                ))}
              </div>
            )}

            {/* Recent Logins */}
            <div style={{ padding: "1.5rem", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0 0 1rem" }}>🔑 Recent Logins</h3>
              {logins.slice(0, 10).map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: l.success ? "#10b981" : "#ef4444" }} />
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{l.userId}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{l.portal} • {l.ip}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", color: l.success ? "#10b981" : "#ef4444", fontWeight: 600 }}>{l.success ? "Success" : "Failed"}</div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{timeAgo(l.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== LOGIN HISTORY ========== */}
        {tab === "logins" && (
          <div style={{ padding: "1.5rem", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0 0 1rem" }}>🔑 All Login Attempts ({logins.length})</h3>
            {logins.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No login attempts recorded yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Status</th>
                      <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#64748b", fontWeight: 600 }}>User</th>
                      <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Portal</th>
                      <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#64748b", fontWeight: 600 }}>IP</th>
                      <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logins.map((l, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "0.6rem 0.5rem" }}>
                          <span style={{ padding: "0.2rem 0.5rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600, background: l.success ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: l.success ? "#10b981" : "#ef4444" }}>
                            {l.success ? "✅ Success" : "❌ Failed"}
                          </span>
                        </td>
                        <td style={{ padding: "0.6rem 0.5rem", fontWeight: 600 }}>{l.userId}</td>
                        <td style={{ padding: "0.6rem 0.5rem", color: "#94a3b8" }}>{l.portal}</td>
                        <td style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontFamily: "monospace", fontSize: "0.75rem" }}>{l.ip}</td>
                        <td style={{ padding: "0.6rem 0.5rem", color: "#64748b" }}>{formatDate(l.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========== ACTIVITY AUDIT TRAIL ========== */}
        {tab === "activity" && (
          <div style={{ padding: "1.5rem", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0 0 1rem" }}>📋 Activity Audit Trail ({audit.length})</h3>
            {audit.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No audit events recorded yet. Events will appear as users interact with the platform.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {audit.slice(0, 50).map((e) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: RISK_COLORS[e.riskLevel] || "#64748b", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.15rem" }}>{e.action}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                        {e.actor} ({e.actorRole}) → {e.targetType}:{e.targetId}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: 4, background: `${RISK_COLORS[e.riskLevel]}20`, color: RISK_COLORS[e.riskLevel], fontWeight: 600, marginBottom: "0.2rem" }}>
                        {e.riskLevel}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "#64748b" }}>{timeAgo(e.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== USERS ========== */}
        {tab === "users" && (
          <div style={{ padding: "1.5rem", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0 0 1rem" }}>👥 Registered Users ({users.length})</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "0.75rem" }}>
              {users.map((u) => {
                const levelInfo = LEVEL_LABELS[u.roleLevel] || { label: u.roleLevel, color: "#64748b" };
                return (
                  <div key={u.userId} style={{ padding: "1rem", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${u.active ? "rgba(255,255,255,0.06)" : "rgba(239,68,68,0.2)"}`, opacity: u.active ? 1 : 0.6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${levelInfo.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", color: levelInfo.color, fontWeight: 700 }}>
                        {u.displayName.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{u.displayName}</div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b" }}>@{u.username}</div>
                      </div>
                      {!u.active && <span style={{ fontSize: "0.65rem", color: "#ef4444", fontWeight: 600 }}>DEACTIVATED</span>}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                      <span style={{ padding: "0.15rem 0.5rem", borderRadius: 6, fontSize: "0.65rem", fontWeight: 600, background: `${levelInfo.color}20`, color: levelInfo.color }}>
                        {levelInfo.label}
                      </span>
                      <span style={{ padding: "0.15rem 0.5rem", borderRadius: 6, fontSize: "0.65rem", fontWeight: 600, background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
                        {u.role}
                      </span>
                      <span style={{ padding: "0.15rem 0.5rem", borderRadius: 6, fontSize: "0.65rem", fontWeight: 600, background: u.googleEmail ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)", color: u.googleEmail ? "#10b981" : "#64748b" }}>
                        {u.authProvider === "both" ? "🔗 Google+Org" : u.authProvider === "google" ? "🔍 Google" : "🔑 Org"}
                      </span>
                    </div>
                    {u.googleEmail && (
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.4rem" }}>📧 {u.googleEmail}</div>
                    )}
                    <div style={{ fontSize: "0.65rem", color: "#475569", marginTop: "0.3rem" }}>
                      Last login: {u.lastLogin ? formatDate(u.lastLogin) : "Never"}
                    </div>
                    {/* Admin Controls */}
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                      <select
                        value={u.roleLevel}
                        onChange={(e) => handlePromote(u.userId, e.target.value)}
                        style={{ padding: "0.3rem 0.5rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: "0.7rem", cursor: "pointer" }}
                      >
                        {LEVEL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} style={{ background: "#1e293b" }}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleToggleActive(u.userId, u.active)}
                        style={{ padding: "0.3rem 0.7rem", borderRadius: 6, border: "none", background: u.active ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)", color: u.active ? "#ef4444" : "#10b981", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer" }}
                      >
                        {u.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
