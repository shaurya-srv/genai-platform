import { NextRequest, NextResponse } from "next/server";
import { AuthService, PortalRole, RoleLevel } from "@/lib/auth";
import { AuditTracker } from "@/lib/audit-tracker";

// Simple auth guard: require session token with ADMIN role
function checkAdmin(request: NextRequest): boolean {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const result = AuthService.validateSession(token);
  return result.valid && result.user?.role === "ADMIN";
}

export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized — ADMIN access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") || "overview";

  switch (section) {
    case "login_history":
      return NextResponse.json(AuthService.getLoginHistory());

    case "audit_trail":
      return NextResponse.json(AuditTracker.getAll());

    case "users":
      return NextResponse.json(AuthService.getAllUsers());

    case "stats": {
      const logins = AuthService.getLoginHistory();
      const audit = AuditTracker.getAll();
      const users = AuthService.getAllUsers();
      const now = Date.now();
      const last24h = now - 24 * 60 * 60 * 1000;

      return NextResponse.json({
        totalUsers: users.length,
        totalLogins: logins.length,
        successfulLogins: logins.filter((l) => l.success).length,
        failedLogins: logins.filter((l) => !l.success).length,
        loginsLast24h: logins.filter((l) => l.timestamp >= last24h).length,
        totalAuditEvents: audit.length,
        highRiskEvents: audit.filter((e) => e.riskLevel === "HIGH").length,
        uniqueActors: new Set(audit.map((e) => e.actor)).size,
        alerts: AuditTracker.getActiveAlerts(),
      });
    }

    default:
      return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized — ADMIN access required" }, { status: 403 });
  }

  const body = await request.json();
  const { action } = body;

  switch (action) {
    case "promote": {
      const { userId, newRoleLevel } = body;
      if (!userId || !newRoleLevel) {
        return NextResponse.json({ error: "userId and newRoleLevel required" }, { status: 400 });
      }

      const success = AuthService.promoteUser(userId, newRoleLevel as RoleLevel);
      if (!success) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      AuditTracker.record({
        eventType: "CONFIGURATION_CHANGED",
        actor: "admin",
        actorRole: "ADMIN",
        targetId: userId,
        targetType: "USER",
        action: `User promoted to ${newRoleLevel}`,
        details: { newRoleLevel },
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: "Admin Panel",
        riskLevel: "MEDIUM",
      });

      return NextResponse.json({ success: true });
    }

    case "deactivate": {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ error: "userId required" }, { status: 400 });
      }

      const success = AuthService.deactivateUser(userId);
      if (!success) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      AuditTracker.record({
        eventType: "CONFIGURATION_CHANGED",
        actor: "admin",
        actorRole: "ADMIN",
        targetId: userId,
        targetType: "USER",
        action: "User deactivated",
        details: {},
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: "Admin Panel",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ success: true });
    }

    case "activate": {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ error: "userId required" }, { status: 400 });
      }

      const success = AuthService.activateUser(userId);
      if (!success) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      AuditTracker.record({
        eventType: "CONFIGURATION_CHANGED",
        actor: "admin",
        actorRole: "ADMIN",
        targetId: userId,
        targetType: "USER",
        action: "User activated",
        details: {},
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: "Admin Panel",
        riskLevel: "MEDIUM",
      });

      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
