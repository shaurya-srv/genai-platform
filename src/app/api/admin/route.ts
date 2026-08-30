import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { AuditTracker } from "@/lib/audit-tracker";

export async function GET(request: NextRequest) {
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
