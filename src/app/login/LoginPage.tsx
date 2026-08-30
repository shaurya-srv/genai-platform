"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, Shield, Check } from "lucide-react";

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

  // Handle Supabase hash fragment tokens (from OAuth redirect)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      if (accessToken) {
        setGoogleLoading(true);
        fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "exchange", access_token: accessToken }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success && data.user) {
              setGoogleVerified(true);
              setGoogleEmail(data.user.googleEmail || data.user.email || "");
              localStorage.setItem(
                "google_session",
                JSON.stringify({ token: data.session.token, userId: data.user.userId })
              );
              window.history.replaceState({}, document.title, window.location.pathname);
            } else {
              setError(data.error || "Failed to complete Google auth");
            }
            setGoogleLoading(false);
          })
          .catch(() => {
            setError("Connection error during auth exchange");
            setGoogleLoading(false);
          });
      }
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const googleRes = await fetch("/api/auth/google");
      const googleData = await googleRes.json();
      if (googleData.mode === "real" && googleData.url) {
        window.location.href = googleData.url;
        return;
      }
      setError(googleData.error || "Google auth not configured");
    } catch {
      setError("Failed to connect to auth server");
    }
    setGoogleLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleVerified) {
      setError("Please sign in with Google first");
      return;
    }
    if (!username || !password) {
      setError("Enter Organization ID and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username, password, portal: "OPERATOR", googleEmail }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        localStorage.setItem("auth_session", JSON.stringify(data.session));
        localStorage.setItem("auth_user", JSON.stringify(data.user));
        localStorage.removeItem("google_session");
        router.push("/dashboard?portal=" + data.user.role + "&userId=" + data.user.userId);
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-[420px] border-border/70 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4 mt-2">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="size-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">NTRO GenAI Platform</CardTitle>
          <CardDescription>Secure dual-authentication access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Auth */}
          {googleVerified ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex size-8 items-center justify-center rounded-lg bg-green-500/15">
                <Check className="size-4 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-green-500">Google Verified</div>
                <div className="text-xs text-muted-foreground">{googleEmail}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-auto p-1"
                onClick={() => {
                  setGoogleVerified(false);
                  setGoogleEmail("");
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <svg className="mr-2 size-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {googleLoading ? "Connecting..." : "Sign in with Google"}
            </Button>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">then enter org credentials</span>
            </div>
          </div>

          {/* Org Credentials Form */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Organization ID
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. chairman, scientist_g"
                disabled={!googleVerified}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={!googleVerified}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !googleVerified}>
              {!googleVerified ? (
                "Complete Google auth first"
              ) : loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In to Platform
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Status indicators */}
          <div className="flex justify-center gap-4 pt-1">
            <div className="flex items-center gap-1.5">
              <div
                className={`size-2 rounded-full ${googleVerified ? "bg-green-500" : "bg-muted-foreground"}`}
              />
              <span
                className={`text-[10px] ${googleVerified ? "text-green-500" : "text-muted-foreground"}`}
              >
                Google {googleVerified ? "Verified" : "Pending"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`size-2 rounded-full ${username && password ? "bg-green-500" : "bg-muted-foreground"}`}
              />
              <span
                className={`text-[10px] ${username && password ? "text-green-500" : "text-muted-foreground"}`}
              >
                Credentials {username && password ? "Ready" : "Pending"}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-1 pt-0">
          <p className="text-[10px] text-muted-foreground text-center">
            Secured by{" "}
            <a
              href="https://freebuff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors"
            >
              freebuff.com
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
          Loading...
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
