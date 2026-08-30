"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [googleVerified, setGoogleVerified] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [challengeId, setChallengeId] = useState("");

  // Handle Google OAuth callback redirect
  useEffect(() => {
    const googleSuccess = searchParams.get("google_success");
    const googleError = searchParams.get("google_error");
    const sessionToken = searchParams.get("session_token");
    const userId = searchParams.get("user_id");
    const userName = searchParams.get("user_name");
    const userRole = searchParams.get("user_role");
    const userLevel = searchParams.get("user_level");
    const googleEmailParam = searchParams.get("google_email");

    if (googleError) {
      setError(`Google auth failed: ${decodeURIComponent(googleError)}`);
      return;
    }

    if (googleSuccess && sessionToken && userId) {
      // Store session and redirect to dashboard
      const user = {
        userId,
        username: userId,
        displayName: userName || "Google User",
        role: userRole || "OPERATOR",
        roleLevel: userLevel || "general_scientist",
        email: googleEmailParam || "",
      };
      localStorage.setItem("auth_session", JSON.stringify({ token: sessionToken, userId, role: userRole }));
      localStorage.setItem("auth_user", JSON.stringify(user));
      router.push(`/dashboard?portal=${userRole}&userId=${userId}`);
      return;
    }

    // Handle Supabase code exchange (when Supabase sends code instead of tokens)
    const supabaseCode = searchParams.get("supabase_code");
    if (supabaseCode) {
      // Exchange code for session via our API
      fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "exchange", code: supabaseCode }),
      }).then(r => r.json()).then(data => {
        if (data.success && data.session && data.user) {
          localStorage.setItem("auth_session", JSON.stringify(data.session));
          localStorage.setItem("auth_user", JSON.stringify(data.user));
          router.push(`/dashboard?portal=${data.user.role}&userId=${data.user.userId}`);
        } else {
          setError(data.error || "Failed to complete Google auth");
        }
      }).catch(() => setError("Connection error during auth exchange"));
    }
  }, [searchParams, router]);

  // Step 1: Google sign-in via Supabase
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true); setError("");
    try {
      const googleRes = await fetch("/api/auth/google");
      const googleData = await googleRes.json();

      if (googleData.mode === "real" && googleData.url) {
        window.location.href = googleData.url;
        return;
      }

      // Supabase not configured — show setup instructions
      setError(googleData.error || "Google auth not configured. Please set up Supabase in .env.local");
    } catch {
      setError("Failed to connect to auth server");
    }
    setGoogleLoading(false);
  };

  // Step 2: Credentials login (requires Google first)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleVerified) { setError("Please sign in with Google first"); return; }
    if (!username || !password) { setError("Enter username and password"); return; }
    setLoading(true); setError("");
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
        setChallengeId(data.challengeId); setMfaRequired(true);
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch { setError("Connection error"); }
    setLoading(false);
  };

  const handleMFA = async (e: React.FormEvent) => {
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


  if (mfaRequired) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)", padding: "2rem" }}>
        <div style={{ padding: "2.5rem", borderRadius: 20, background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.08)", width: "100%", maxWidth: 440 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f1f5f9", textAlign: "center", marginBottom: "1rem" }}>🔐 Enter TOTP Code</h2>
          <form onSubmit={handleMFA}>
            <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value)} placeholder="6-digit code" maxLength={6} style={{ width: "100%", padding: "1rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: "1.5rem", textAlign: "center", letterSpacing: "0.5em", outline: "none" }} required />
            {error && <div style={{ padding: "0.6rem 1rem", borderRadius: 8, background: "rgba(239,68,68,0.1)", color: "#fca5a5", fontSize: "0.8rem", margin: "1rem 0" }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.85rem", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", marginTop: "1rem" }}>{loading ? "Verifying..." : "Verify"}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)", padding: "2rem" }}>
      <div style={{ padding: "2.5rem", borderRadius: 20, background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", margin: "0 auto 1rem" }}>{"🛡️"}</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.25rem" }}>NTRO GenAI Platform</h1>
          <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Secure Access Portal</p>
        </div>

        {/* Google Auth (top) */}
        {googleVerified ? (
          <div style={{ padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>{"✅"}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#10b981" }}>Google Verified</div><div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{googleEmail}</div></div>
            <button onClick={() => { setGoogleVerified(false); setGoogleEmail(""); }} style={{ fontSize: "0.7rem", color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>Change</button>
          </div>
        ) : (
          <button onClick={handleGoogleSignIn} disabled={googleLoading} style={{ width: "100%", padding: "0.75rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#f1f5f9", fontSize: "0.9rem", fontWeight: 600, cursor: googleLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {googleLoading ? "Connecting..." : "Sign in with Google"}
          </button>
        )}

        {/* Divider */}
        <div style={{ margin: "0.5rem 0 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>then sign in with org credentials</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.35rem", display: "block" }}>Organization ID</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. chairman, scientist_g, scientist" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: "0.9rem", outline: "none" }} required />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.35rem", display: "block" }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: "0.9rem", outline: "none" }} required />
          </div>
          {error && <div style={{ padding: "0.6rem 1rem", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: "0.8rem", marginBottom: "1rem" }}>{error}</div>}
          <button type="submit" disabled={loading || !googleVerified} style={{ width: "100%", padding: "0.85rem", borderRadius: 10, border: "none", background: googleVerified ? "linear-gradient(135deg, #3b82f6, #8b5cf6)" : "rgba(255,255,255,0.05)", color: googleVerified ? "#fff" : "#64748b", fontSize: "0.95rem", fontWeight: 700, cursor: loading || !googleVerified ? "not-allowed" : "pointer" }}>
              {!googleVerified ? "Complete Google auth first" : loading ? "Signing in..." : "Sign In to Platform"}
          </button>
        </form>

        {/* Status indicator */}
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: googleVerified ? "#10b981" : "#64748b" }} />
            <span style={{ fontSize: "0.65rem", color: googleVerified ? "#10b981" : "#64748b" }}>Google {googleVerified ? "Verified" : "Pending"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: username && password ? "#10b981" : "#64748b" }} />
            <span style={{ fontSize: "0.65rem", color: username && password ? "#10b981" : "#64748b" }}>Credentials {username && password ? "Ready" : "Pending"}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (<Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "#94a3b8" }}>Loading...</div>}><LoginPageInner /></Suspense>);
}
