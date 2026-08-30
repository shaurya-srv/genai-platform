import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (edge-compatible)
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, route: string): boolean {
  const limit = route.startsWith("/api/auth") ? 10 : route.startsWith("/api/transform") ? 20 : 60;
  const windowMs = 60 * 1000;
  const key = `${ip}:${route}`;
  const now = Date.now();

  const entry = rateBuckets.get(key);
  if (!entry || now > entry.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}

// Cleanup every 5 min
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup > 5 * 60 * 1000) {
    lastCleanup = now;
    for (const [key, entry] of rateBuckets.entries()) {
      if (now > entry.resetAt) rateBuckets.delete(key);
    }
  }
}

export function middleware(request: NextRequest) {
  maybeCleanup();

  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const pathname = request.nextUrl.pathname;

  // Rate limit API routes
  if (pathname.startsWith("/api/")) {
    if (!checkRateLimit(ip, pathname)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again in 1 minute." },
        { status: 429 }
      );
    }
  }

  // Block admin API without session token (client-side guard handles the page)
  if (pathname.startsWith("/api/admin") && request.method === "GET") {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
