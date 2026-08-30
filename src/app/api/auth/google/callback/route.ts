/**
 * GET /api/auth/google/callback?code=...&state=...
 * 
 * Handles Google OAuth redirect after user consents.
 * Exchanges authorization code for access token,
 * fetches user profile from Google, creates or links account,
 * then redirects to dashboard with session.
 */

import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { persistAuthUser } from "@/lib/db-init";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // Contains userId or portal info
  const error = searchParams.get("error");

  // Handle Google returning an error (user denied consent, etc.)
  if (error) {
    const errorDesc = searchParams.get("error_description") || error;
    return NextResponse.redirect(
      new URL(`/login?google_error=${encodeURIComponent(errorDesc)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?google_error=No+authorization+code+received", request.url)
    );
  }

  try {
    // Initialize Google OAuth config
    AuthService.initializeGoogleOAuth();

    // Build the redirect URI (must match what was used in the auth request)
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Exchange code for tokens and get user info
    const result = await AuthService.handleGoogleCallback(code, redirectUri);

    if (!result.success || !result.user || !result.session) {
      return NextResponse.redirect(
        new URL(`/login?google_error=${encodeURIComponent(result.error || "Authentication failed")}`, request.url)
      );
    }

    // Persist to database
    persistAuthUser(result.user);

    // Redirect to dashboard with session data in URL params
    // The login page will read these and store in localStorage
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("google_success", "true");
    redirectUrl.searchParams.set("session_token", result.session.token);
    redirectUrl.searchParams.set("user_id", result.user.userId);
    redirectUrl.searchParams.set("user_name", result.user.displayName);
    redirectUrl.searchParams.set("user_role", result.user.role);
    redirectUrl.searchParams.set("user_level", result.user.roleLevel);
    redirectUrl.searchParams.set("google_email", result.user.googleEmail || result.user.email || "");
    redirectUrl.searchParams.set("is_new", result.isNewUser ? "true" : "false");

    return NextResponse.redirect(redirectUrl);
  } catch (e) {
    return NextResponse.redirect(
      new URL(`/login?google_error=${encodeURIComponent(String(e))}`, request.url)
    );
  }
}
