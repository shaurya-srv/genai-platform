/**
 * GET /api/auth/google/callback?code=...&access_token=...
 * 
 * Handles Google OAuth redirect.
 * Supabase handles the token exchange — we just need to capture the session
 * and redirect to the login page with the tokens.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { AuthService } from "@/lib/auth";
import { persistAuthUser } from "@/lib/db-init";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Supabase sends these params after successful OAuth
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?google_error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  // Supabase configured — handle the session
  if (isSupabaseConfigured()) {
    if (accessToken) {
      // Direct access token from Supabase
      try {
        const { verifySupabaseToken } = await import("@/lib/supabase");
        const supabaseUser = await verifySupabaseToken(accessToken);

        if (!supabaseUser) {
          return NextResponse.redirect(
            new URL("/login?google_error=Failed+to+verify+Google+session", request.url)
          );
        }

        // Find or create user
        const allUsers = AuthService.getAllUsers();
        let user: typeof allUsers[0] | null | undefined = allUsers.find(u => u.googleId === supabaseUser.id || u.email === supabaseUser.email);

        if (!user) {
          user = AuthService.createUser(
            supabaseUser.email.split("@")[0],
            supabaseUser.name,
            "OPERATOR",
            "general_scientist"
          );
          if (user) {
            user.googleId = supabaseUser.id;
            user.googleEmail = supabaseUser.email;
            user.avatar = supabaseUser.avatar;
            user.authProvider = "google";
            persistAuthUser(user);
          }
        } else {
          user.lastLogin = Date.now();
          user.googleId = supabaseUser.id;
          user.googleEmail = supabaseUser.email;
          user.authProvider = "both";
          persistAuthUser(user);
        }

        if (!user) {
          return NextResponse.redirect(
            new URL("/login?google_error=Failed+to+create+user", request.url)
          );
        }

        const session = AuthService.createSession(user);

        // Redirect to login page with session data
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("google_success", "true");
        redirectUrl.searchParams.set("session_token", session.token);
        redirectUrl.searchParams.set("user_id", user.userId);
        redirectUrl.searchParams.set("user_name", user.displayName);
        redirectUrl.searchParams.set("user_role", user.role);
        redirectUrl.searchParams.set("user_level", user.roleLevel);
        redirectUrl.searchParams.set("google_email", user.googleEmail || "");

        return NextResponse.redirect(redirectUrl);
      } catch (e) {
        return NextResponse.redirect(
          new URL(`/login?google_error=${encodeURIComponent(String(e))}`, request.url)
        );
      }
    }

    // If we got a code but no access_token, Supabase may handle it client-side
    // Redirect to login with the code so client can exchange it
    if (code) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("supabase_code", code);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Fallback — Supabase not configured, try demo mode
  if (code === "demo-code" || !isSupabaseConfigured()) {
    const result = await AuthService.handleGoogleCallback("demo-code");
    if (result.success && result.user && result.session) {
      persistAuthUser(result.user);
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("google_success", "true");
      redirectUrl.searchParams.set("session_token", result.session.token);
      redirectUrl.searchParams.set("user_id", result.user.userId);
      redirectUrl.searchParams.set("user_name", result.user.displayName);
      redirectUrl.searchParams.set("user_role", result.user.role);
      redirectUrl.searchParams.set("user_level", result.user.roleLevel);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(
    new URL("/login?google_error=No+authentication+data+received", request.url)
  );
}
