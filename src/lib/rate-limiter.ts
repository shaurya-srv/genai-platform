/**
 * Simple in-memory rate limiter
 * Tracks request counts per IP per route
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets: Map<string, RateLimitEntry> = new Map();

const DEFAULT_LIMITS: Record<string, number> = {
  "/api/auth": 10,        // 10 attempts per minute
  "/api/auth/google": 5,  // 5 OAuth attempts per minute
  "/api/transform": 20,   // 20 transforms per minute
  "/api/approval": 30,    // 30 approval actions per minute
  "/api/admin": 60,       // 60 admin actions per minute
};

export function checkRateLimit(ip: string, route: string, limit?: number): { allowed: boolean; remaining: number } {
  const maxRequests = limit || DEFAULT_LIMITS[route] || 30;
  const windowMs = 60 * 1000; // 1 minute window
  const key = `${ip}:${route}`;
  const now = Date.now();

  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: maxRequests - entry.count };
}

// Cleanup old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets.entries()) {
      if (now > entry.resetAt) buckets.delete(key);
    }
  }, 5 * 60 * 1000);
}
