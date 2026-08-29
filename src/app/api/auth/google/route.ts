import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

/**
 * GET /api/auth/google
 * Returns the Google OAuth authorization URL.
 * - Real mode: redirects to Google's consent screen
 * - Demo mode: returns a URL the frontend can use to simulate auth
 */
export async function GET(request: NextRequest) {
  AuthService.initializeGoogleOAuth();

  const authURL = AuthService.getGoogleAuthURL();

  // If authURL is a relative path (/api/auth?action=google_mock), we're in demo mode
  if (authURL.startsWith("/")) {
    return NextResponse.json({
      mode: "demo",
      url: null,
      message: "Google OAuth not configured — using demo mode",
    });
  }

  // Real Google OAuth URL — return it so the frontend can redirect
  return NextResponse.json({
    mode: "real",
    url: authURL,
  });
}
