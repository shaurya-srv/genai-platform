import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

/**
 * GET /api/auth/google
 * Returns the Google OAuth authorization URL.
 * 
 * Environment variables needed in .env.local:
 *   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
 *   GOOGLE_CLIENT_SECRET=your-client-secret
 * 
 * The redirect URI must be added to Google Cloud Console:
 *   http://localhost:3000/api/auth/google/callback  (dev)
 *   https://your-domain.vercel.app/api/auth/google/callback  (prod)
 */
export async function GET(request: NextRequest) {
  AuthService.initializeGoogleOAuth();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Handle mock/demo Google auth
  if (action === "google_mock") {
    const mockUser = AuthService.mockGoogleAuth();
    const result = await AuthService.handleGoogleCallback("demo-code");
    return NextResponse.json({
      success: true,
      session: result.session,
      user: result.user,
      isNewUser: result.isNewUser,
    });
  }

  // Build the real Google OAuth URL
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    // No credentials configured — return demo mode
    return NextResponse.json({
      mode: "demo",
      url: null,
      message: "Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local",
    });
  }

  // Build redirect URI from the current request origin
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.json({
    mode: "real",
    url: authUrl,
    redirectUri,
  });
}
