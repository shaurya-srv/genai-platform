import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * GET /api/auth/google
 * Returns the Supabase Google OAuth URL.
 * No demo fallback — requires real Supabase configuration.
 */
export async function GET(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({
      mode: "unconfigured",
      url: null,
      error: "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
    }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/login`;

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
      mode: "error",
      url: null,
      error: `OAuth error: ${error?.message || "Failed to generate auth URL"}`,
    }, { status: 500 });
  }

  return NextResponse.json({
    mode: "real",
    url: data.url,
  });
}

/**
 * POST /api/auth/google
 * Exchange Supabase access token for a platform session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, access_token } = body;

    if (action === "exchange" && access_token) {
      const { verifySupabaseToken } = await import("@/lib/supabase");
      const { persistAuthUser } = await import("@/lib/db-init");
      const { AuthService } = await import("@/lib/auth");
      const { lookupRole } = await import("@/lib/role-registry");

      const supabaseUser = await verifySupabaseToken(access_token);
      if (!supabaseUser) {
        return NextResponse.json({ error: "Invalid Supabase token" }, { status: 401 });
      }

      const allUsers = AuthService.getAllUsers();
      let existingUser: typeof allUsers[0] | null | undefined = allUsers.find(
        u => u.googleId === supabaseUser.id || u.email === supabaseUser.email
      );

      if (!existingUser) {
        // Look up role from registry based on Google email
        const roleInfo = lookupRole(supabaseUser.email);
        existingUser = AuthService.createUser(
          supabaseUser.email.split("@")[0],
          supabaseUser.name,
          roleInfo.portalRole,
          roleInfo.roleLevel
        );
        if (existingUser) {
          existingUser.googleId = supabaseUser.id;
          existingUser.googleEmail = supabaseUser.email;
          existingUser.avatar = supabaseUser.avatar;
          existingUser.authProvider = "google";
          persistAuthUser(existingUser);
        }
      } else {
        existingUser.lastLogin = Date.now();
        existingUser.googleId = supabaseUser.id;
        existingUser.googleEmail = supabaseUser.email;
        existingUser.authProvider = "both";
        persistAuthUser(existingUser);
      }

      if (!existingUser) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }

      const session = AuthService.createSession(existingUser);
      return NextResponse.json({ success: true, session, user: existingUser });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
