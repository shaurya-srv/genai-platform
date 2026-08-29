"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * /login/google-callback?token=...&userId=...&username=...&displayName=...&email=...&role=...&roleLevel=...
 *
 * Receives Google OAuth session data from the callback redirect,
 * stores it in localStorage, and redirects to the dashboard.
 */
function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");
    const username = searchParams.get("username");
    const displayName = searchParams.get("displayName");
    const email = searchParams.get("email");
    const role = searchParams.get("role");
    const roleLevel = searchParams.get("roleLevel");
    const avatar = searchParams.get("avatar");
    const error = searchParams.get("error");

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!token || !userId || !username || !role) {
      router.replace("/login?error=Missing+session+data");
      return;
    }

    // Build the session and user objects
    const session = {
      token,
      userId,
      role,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    };

    const user = {
      userId,
      username,
      displayName: displayName || username,
      email: email || "",
      role,
      roleLevel: roleLevel || "general_scientist",
      portalUrl: `/dashboard?portal=${role}&userId=${userId}`,
      avatar: avatar || "",
      googleEmail: email || "",
      authProvider: "google",
    };

    // Store in localStorage
    localStorage.setItem("auth_session", JSON.stringify(session));
    localStorage.setItem("auth_user", JSON.stringify(user));

    // Redirect to dashboard
    router.replace(`/dashboard?portal=${role}&userId=${userId}`);
  }, [searchParams, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)",
        color: "#f1f5f9",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      >
        🛡️
      </div>
      <div style={{ fontSize: "1rem", fontWeight: 600 }}>Verifying Google identity...</div>
      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Setting up your session</div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#020617",
            color: "#94a3b8",
          }}
        >
          Loading...
        </div>
      }
    >
      <GoogleCallbackInner />
    </Suspense>
  );
}
