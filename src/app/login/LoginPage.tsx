"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"google" | "credentials" | "mfa">("google");
  const [googleUser, setGoogleUser] = useState<{email: string; name: string} | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [challengeId, setChallengeId] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "google_login" }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setGoogleUser({ email: data.user.googleEmail || data.user.email || "demo@ntro.gov.in", name: data.user.displayName });
        setStep("credentials");
      } else {
        setError(data.error || "Google authentication failed");
      }
    } catch {
      setGoogleUser({ email: "demo@ntro.gov.in", name: "NTRO Demo User" });
      setStep("credentials");
    }
    setLoading(false);
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username, password, portal: "OPERATOR" }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        localStorage.setItem("auth_session", JSON.stringify(data.session));
        localStorage.setItem("auth_user", JSON.stringify(data.user));
        router.push("/dashboard?portal=" + data.user.role + "&userId=" + data.user.userId);
      } else if (data.mfaRequired) {
        setChallengeId(data.challengeId);
        setStep("mfa");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  };

  const handleMFAVerify = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify_mfa", challengeId, code: mfaCode }) });
      const data = await res.json();
      if (data.success && data.session) {
        localStorage.setItem("auth_session", JSON.stringify(data.session));
        localStorage.setItem("auth_user", JSON.stringify(data.user));
        router.push("/dashboard?portal=" + data.user.role + "&userId=" + data.user.userId);
      } else { setError(data.error || "Invalid code"); }
    } catch { setError("Connection error"); }
    setLoading(false);
  };

  const cardStyle: React.CSSProperties = { padding: "2.5rem", borderRadius: 20, background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: "0.9rem", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)", padding: "2rem" }}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", margin: "0 auto 1rem" }}>{"🛡️"}</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.25rem" }}>NTRO GenAI Platform</h1>
          <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Secure Access Portal</p>
        </div>

        {/* Step 1: Google Sign-In */}
        {step === "google" && (
          <div>
            <button onClick={handleGoogleSignIn} disabled={loading} style={{ width: "100%", padding: "0.85rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#f1f5f9", fontSize: "0.95rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {loading ? "Connecting..." : "Sign in with Google"}
            </button>
            <div style={{ margin: "1.5rem 0", display: "flex", alignItems: "center", gap: "1rem" }}><div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} /><span style={{ fontSize: "0.75rem", color: "#64748b" }}>Google OAuth Required</span><div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} /></div>
            <p style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center", lineHeight: 1.5 }}>All NTRO personnel must authenticate via Google first, then verify with organization credentials.</p>
          </div>
        )}

        {/* Step 2: Org Credentials */}
        {step === "credentials" && (
          <div>
            {googleUser && (
              <div style={{ padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>{"✅"}</div>
                <div><div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#10b981" }}>Google Verified</div><div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{googleUser.email}</div></div>
              </div>
            )}
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1rem" }}>Now enter your NTRO organization ID and password:</p>
            <form onSubmit={handleCredentialsLogin}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.35rem", display: "block" }}>Organization ID</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. chairman, scientist_g, scientist" style={inputStyle} required />
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.35rem", display: "block" }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={inputStyle} required />
              </div>
              {error && <div style={{ padding: "0.6rem 1rem", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: "0.8rem", marginBottom: "1rem" }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.85rem", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", fontSize: "0.95rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Verifying..." : "Verify & Access Platform"}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: MFA */}
        {step === "mfa" && (
          <form onSubmit={handleMFAVerify}>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1rem" }}>Enter your TOTP code from your authenticator app:</p>
            <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value)} placeholder="6-digit code" maxLength={6} style={{ ...inputStyle, textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5em", padding: "1rem" }} required />
            {error && <div style={{ padding: "0.6rem 1rem", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: "0.8rem", margin: "1rem 0" }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.85rem", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", fontSize: "0.95rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: "0.5rem" }}>
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <button type="button" onClick={() => setStep("credentials")} style={{ width: "100%", padding: "0.75rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: "0.85rem", cursor: "pointer", marginTop: "0.5rem" }}>Back to Credentials</button>
          </form>
        )}

        {/* Step indicators */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
          {["google", "credentials", "mfa"].map((s, i) => (
            <div key={s} style={{ width: 8, height: 8, borderRadius: 4, background: step === s ? "#3b82f6" : "rgba(255,255,255,0.15)", transition: "all 0.3s" }} />
          ))}
        </div>

        {/* Demo accounts info */}
        <div style={{ marginTop: "1.5rem", padding: "1rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: 600 }}>Demo Accounts (password: ntro123)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem" }}>
            {["chairman", "scientist_g", "scientist_d", "scientist"].map(u => (
              <div key={u} onClick={() => { setUsername(u); setPassword("ntro123"); }} style={{ fontSize: "0.65rem", color: "#94a3b8", cursor: "pointer", padding: "0.2rem 0.4rem", borderRadius: 4, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={e => e.currentTarget.style.background = "transparent" }}>{u}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (<Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "#94a3b8" }}>Loading...</div>}><LoginPageInner /></Suspense>);
}
