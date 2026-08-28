"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PORTAL_CONFIG, PortalRole } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portal = (searchParams.get("portal") || "operator") as PortalRole;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaChallengeId, setMfaChallengeId] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [totpRemaining, setTotpRemaining] = useState(30);

  // TOTP countdown timer
  useEffect(() => {
    if (!mfaRequired) return;
    const interval = setInterval(() => {
      setTotpRemaining((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [mfaRequired]);

  const config = PORTAL_CONFIG[portal] || PORTAL_CONFIG.OPERATOR;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username, password, portal }),
      });
      const data = await res.json();

      if (data.mfaRequired) {
        setMfaRequired(true);
        setMfaChallengeId(data.challengeId);
        setLoading(false);
        return;
      }

      if (!data.success) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Store session
      localStorage.setItem("auth_session", JSON.stringify(data.session));
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      localStorage.setItem("auth_portal", portal);

      // Redirect to dashboard with portal context
      router.push(`/dashboard?portal=${portal}&userId=${data.user.userId}`);
    } catch (e) {
      setError("Connection error: " + String(e));
      setLoading(false);
    }
  };

  const handleMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_mfa", challengeId: mfaChallengeId, code: mfaCode }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "MFA verification failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("auth_session", JSON.stringify(data.session));
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      localStorage.setItem("auth_portal", data.user.role || portal);

      router.push(`/dashboard?portal=${data.user.role || portal}&userId=${data.user.userId}`);
    } catch (e) {
      setError("Connection error: " + String(e));
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0f172a 100%)",
      padding: "2rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "440px",
        background: "rgba(17, 24, 39, 0.95)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        padding: "2.5rem",
        boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
        backdropFilter: "blur(20px)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🛡️</div>
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "0.25rem",
          }}>
            NTRO GenAI Platform
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "0.8rem" }}>
            NTRO • Content Transformation • Blockchain Security
          </p>
        </div>

        {/* Portal Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0.6rem 1rem",
          background: `${config.color}15`,
          border: `1px solid ${config.color}40`,
          borderRadius: "10px",
          marginBottom: "1.5rem",
        }}>
          <span style={{ fontSize: "1.25rem" }}>{config.icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: config.color }}>{config.name} Portal</div>
            <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{config.description}</div>
          </div>
        </div>

        {/* Portal Selector */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem" }}>
          {(["OPERATOR", "APPROVER", "ADMIN", "AUDITOR"] as const).map((p) => {
            const c = PORTAL_CONFIG[p];
            const isActive = p === portal;
            return (
              <a
                key={p}
                href={`/login?portal=${p.toLowerCase()}`}
                style={{
                  flex: 1,
                  padding: "0.5rem 0.25rem",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.2s",
                  background: isActive ? `${c.color}20` : "transparent",
                  border: isActive ? `1px solid ${c.color}` : "1px solid transparent",
                  color: isActive ? c.color : "#9ca3af",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: "1rem" }}>{c.icon}</div>
                <div>{p.charAt(0).toUpperCase() + p.slice(1)}</div>
              </a>
            );
          })}
        </div>

        {/* Google Auth Button */}
        <button
          type="button"
          onClick={async () => {
            setLoading(true);
            try {
              // Demo: simulate Google OAuth — in production, redirect to Google
              const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'google_login', portal }),
              });
              const data = await res.json();
              if (data.success) {
                localStorage.setItem('auth_session', JSON.stringify(data.session));
                localStorage.setItem('auth_user', JSON.stringify(data.user));
                localStorage.setItem('auth_portal', data.user.role || portal);
                router.push(`/dashboard?portal=${data.user.role || portal}&userId=${data.user.userId}`);
              } else {
                setError(data.error || 'Google login failed');
              }
            } catch (e) {
              setError('Google login error: ' + String(e));
            } finally {
              setLoading(false);
            }
          }}
          style={{
            width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.05)', color: '#f3f4f6', fontSize: '0.9rem', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            marginBottom: '1rem', transition: 'all 0.2s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign in with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>or sign in with credentials</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Login Form or MFA Form */}
        {!mfaRequired ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#d1d5db", marginBottom: "0.4rem" }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={`Enter ${config.name.toLowerCase()} username`}
                required
                style={{
                  width: "100%",
                  padding: "0.7rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#f3f4f6",
                  fontSize: "0.9rem",
                  outline: "none",
                  transition: "border 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = config.color}
                onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#d1d5db", marginBottom: "0.4rem" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: "100%",
                  padding: "0.7rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#f3f4f6",
                  fontSize: "0.9rem",
                  outline: "none",
                  transition: "border 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = config.color}
                onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            {error && (
              <div style={{
                padding: "0.6rem 1rem",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                color: "#fca5a5",
                fontSize: "0.8rem",
                marginBottom: "1rem",
              }}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              style={{
                width: "100%",
                padding: "0.8rem",
                borderRadius: "10px",
                border: "none",
                background: loading ? "#374151" : config.color,
                color: "#fff",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? "⏳ Signing in..." : `${config.icon} Sign in to ${config.name} Portal`}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMFA}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔐</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f3f4f6", marginBottom: "0.25rem" }}>Two-Factor Authentication</h3>
              <p style={{ color: "#9ca3af", fontSize: "0.8rem" }}>Enter the 6-digit code from your authenticator app</p>
            </div>

            {/* TOTP Countdown */}
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: totpRemaining <= 5 ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.1)', borderRadius: '8px', border: `1px solid ${totpRemaining <= 5 ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.2)'}` }}>
                <span style={{ fontSize: '0.75rem', color: totpRemaining <= 5 ? '#fca5a5' : '#93c5fd' }}>🔄 Code refreshes in</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: totpRemaining <= 5 ? '#ef4444' : '#3b82f6' }}>{String(totpRemaining).padStart(2, '0')}s</span>
              </div>
              <div style={{ marginTop: '0.4rem', width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(totpRemaining / 30) * 100}%`, background: totpRemaining <= 5 ? '#ef4444' : '#3b82f6', transition: 'width 1s linear, background 0.3s', borderRadius: '2px' }} />
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                style={{
                  width: "100%",
                  padding: "0.8rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#f3f4f6",
                  fontSize: "1.5rem",
                  fontFamily: "monospace",
                  letterSpacing: "0.5rem",
                  textAlign: "center",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {error && (
              <div style={{
                padding: "0.6rem 1rem",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                color: "#fca5a5",
                fontSize: "0.8rem",
                marginBottom: "1rem",
              }}>
                ❌ {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || mfaCode.length < 6}
              style={{
                width: "100%",
                padding: "0.8rem",
                borderRadius: "10px",
                border: "none",
                background: loading ? "#374151" : config.color,
                color: "#fff",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "⏳ Verifying..." : "✅ Verify Code"}
            </button>
            <button
              type="button"
              onClick={() => { setMfaRequired(false); setMfaCode(""); setError(""); }}
              style={{
                width: "100%",
                padding: "0.6rem",
                marginTop: "0.75rem",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "#9ca3af",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              ← Back to login
            </button>
          </form>
        )}

        {/* Demo Credentials */}
        <div style={{
          marginTop: "1.5rem",
          padding: "0.75rem 1rem",
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: "8px",
          fontSize: "0.7rem",
          color: "#93c5fd",
        }}>
          <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>🔑 Demo Credentials</div>
          <div>Username: <span style={{ fontFamily: "monospace" }}>{config.name === 'Operator' ? 'operator' : config.name.includes('Reviewer') ? 'approver' : config.name === 'Administrator' ? 'admin' : 'auditor'}</span></div>
          <div>Password: <span style={{ fontFamily: "monospace" }}>{config.name === 'Operator' ? 'operator123' : config.name.includes('Reviewer') ? 'approver123' : config.name === 'Administrator' ? 'admin123' : 'auditor123'}</span></div>
        </div>
      </div>
    </div>
  );
}
