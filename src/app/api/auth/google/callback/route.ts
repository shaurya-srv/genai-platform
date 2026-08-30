/**
 * GET /api/auth/google/callback?access_token=...
 * 
 * Handles Google OAuth redirect from Supabase.
 * Verifies the token, creates/links user, redirects to dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, verifySupabaseToken } from "@/lib/supabase";
import { AuthService } from "@/lib/auth";
import { persistAuthUser } from "@/lib/db-init";
import { lookupRole } from "@/lib/role-registry";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const accessToken = searchParams.get("access_token");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?google_error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  // Require Supabase to be configured
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL("/login?google_error=Supabase+not+configured.+Add+NEXT_PUBLIC_SUPABASE_URL+and+NEXT_PUBLIC_SUPABASE_ANON_KEY+to+.env.local", request.url)
    );
  }

  if (!accessToken) {
    return NextResponse.redirect(
      new URL("/login?google_error=No+access+token+received+from+Google", request.url)
    );
  }

  // Verify the Supabase token
  const supabaseUser = await verifySupabaseToken(accessToken);
  if (!supabaseUser) {
    return NextResponse.redirect(
      new URL("/login?google_error=Failed+to+verify+Google+session", request.url)
    );
  }

  // Find or create user
  const allUsers = AuthService.getAllUsers();
  let user: typeof allUsers[0] | null | undefined = allUsers.find(
    u => u.googleId === supabaseUser.id || u.email === supabaseUser.email
  );

  if (!user) {
    // Look up role from registry based on Google email
    const roleInfo = lookupRole(supabaseUser.email);
    user = AuthService.createUser(
      supabaseUser.email.split("@")[0],
      supabaseUser.name,
      roleInfo.portalRole,
      roleInfo.roleLevel
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
      new URL("/login?google_error=Failed+to+create+user+account", request.url)
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
}
