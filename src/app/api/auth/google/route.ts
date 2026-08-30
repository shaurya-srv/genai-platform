import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase";
import { AuthService } from "@/lib/auth";

/**
 * GET /api/auth/google
 * Initiates Google OAuth via Supabase.
 * 
 * - Real mode: returns Supabase auth URL to redirect to
 * - Demo mode: simulates Google auth
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Handle mock/demo Google auth
  if (action === "google_mock") {
    const result = await AuthService.handleGoogleCallback("demo-code");
    return NextResponse.json({
      success: true,
      session: result.session,
      user: result.user,
      isNewUser: result.isNewUser,
    });
  }

  // Check if Supabase is configured
  const supabase = getSupabaseServer();
  if (!supabase) {
    // No Supabase — use demo mode
    return NextResponse.json({
      mode: "demo",
      url: null,
      message: "Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    });
  }

  // Build redirect URI from the current request origin
  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/api/auth/google/callback`;

  // Use Supabase to get the Google OAuth URL
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data?.url) {
    return NextResponse.json({
      mode: "demo",
      url: null,
      message: `Supabase OAuth error: ${error?.message || "No URL returned"}`,
    });
  }

  return NextResponse.json({
    mode: "real",
    url: data.url,
  });
}

/**
 * POST /api/auth/google
 * Handle Supabase session exchange after OAuth callback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, access_token } = body;

    if (action === "exchange" && access_token) {
      // Verify the Supabase token and create/link user
      const { verifySupabaseToken } = await import("@/lib/supabase");
      const { persistAuthUser } = await import("@/lib/db-init");

      const supabaseUser = await verifySupabaseToken(access_token);
      if (!supabaseUser) {
        return NextResponse.json({ error: "Invalid Supabase token" }, { status: 401 });
      }

      // Find or create user in our system
      const allUsers = AuthService.getAllUsers();
      let existingUser: typeof allUsers[0] | null | undefined = allUsers.find(u => u.googleId === supabaseUser.id || u.email === supabaseUser.email);

      if (!existingUser) {
        // Create new user from Google profile
        const id = `g-${Date.now().toString(36)}`;
        existingUser = AuthService.createUser(
          supabaseUser.email.split("@")[0],
          supabaseUser.name,
          "OPERATOR",
          "general_scientist"
        );
        if (existingUser) {
          existingUser.googleId = supabaseUser.id;
          existingUser.googleEmail = supabaseUser.email;
          existingUser.avatar = supabaseUser.avatar;
          existingUser.authProvider = "google";
          persistAuthUser(existingUser);
        }
      } else {
        // Update existing user's Google info
        existingUser.lastLogin = Date.now();
        existingUser.googleId = supabaseUser.id;
        existingUser.googleEmail = supabaseUser.email;
        existingUser.authProvider = "both";
        persistAuthUser(existingUser);
      }

      if (!existingUser) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }

      // Create session
      const session = AuthService.createSession(existingUser);

      return NextResponse.json({
        success: true,
        session,
        user: existingUser,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
