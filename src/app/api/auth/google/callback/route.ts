import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

/**
 * GET /api/auth/google/callback?code=...&state=...
 * Handles the Google OAuth redirect callback.
 * 1. Exchanges authorization code for tokens
 * 2. Fetches user info from Google
 * 3. Creates/finds user in our system
 * 4. Issues a session token
 * 5. Redirects to dashboard with session data
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Google returned an error (user denied access, etc.)
  if (error) {
    const errorDesc = searchParams.get("error_description") || error;
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDesc)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=Missing+authorization+code", request.url)
    );
  }

  try {
    AuthService.initializeGoogleOAuth();

    // Exchange code for tokens and get Google user info
    const result = await AuthService.handleGoogleCallback(code);

    if (!result.success || !result.user || !result.session) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(result.error || "Google auth failed")}`, request.url)
      );
    }

    // Redirect to dashboard with session data in URL params
    // The frontend will store these in localStorage
    const params = new URLSearchParams({
      token: result.session.token,
      userId: result.user.userId,
      username: result.user.username,
      displayName: result.user.displayName,
      email: result.user.googleEmail || result.user.email || "",
      role: result.user.role,
      roleLevel: result.user.roleLevel,
      avatar: result.user.avatar || "",
      isNewUser: result.isNewUser ? "1" : "0",
    });

    return NextResponse.redirect(
      new URL(`/login/google-callback?${params.toString()}`, request.url)
    );
  } catch (e) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(String(e))}`, request.url)
    );
  }
}
