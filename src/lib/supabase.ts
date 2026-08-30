/**
 * Supabase Client Configuration
 * 
 * Handles Google OAuth authentication via Supabase.
 * 
 * Setup:
 * 1. Create a project at https://supabase.com
 * 2. Go to Authentication → Providers → Google
 * 3. Enable Google provider and paste your Google OAuth credentials
 * 4. Copy your project URL and anon key to .env.local
 * 
 * Environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 */

import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Server-side client (for API routes)
let serverClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (serverClient) return serverClient;
  serverClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Server-side doesn't persist
    },
  });
  return serverClient;
}

// Client-side singleton (for browser)
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (browserClient) return browserClient;
  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, // Handles OAuth callback redirect
    },
  });
  return browserClient;
}

// ==================== HELPER TYPES ====================

export interface SupabaseAuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: string;
}

// ==================== AUTH HELPERS ====================

/**
 * Get the current Supabase session (server-side)
 */
export async function getSupabaseSession(accessToken: string): Promise<Session | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Verify a Supabase JWT and get user info
 */
export async function verifySupabaseToken(accessToken: string): Promise<SupabaseAuthUser | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return null;
    
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
      avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      provider: user.app_metadata?.provider || 'google',
    };
  } catch {
    return null;
  }
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}
