import { NextRequest, NextResponse } from "next/server";
import { RBAC } from "@/lib/rbac";
import type { RBACRole } from "@/lib/rbac";
import { AuditTracker } from "@/lib/audit-tracker";

/**
 * GET /api/rbac — List roles, assignments, stats, or check a permission
 * POST /api/rbac — Assign or deactivate users
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action") || "roles";

  switch (action) {
    case "roles": {
      return NextResponse.json(RBAC.getRoles());
    }

    case "assignments": {
      return NextResponse.json(RBAC.getAllAssignments());
    }

    case "check": {
      const userId = searchParams.get("userId") || "admin-001";
      const permission = searchParams.get("permission");
      if (!permission) {
        return NextResponse.json({ error: "permission parameter required" }, { status: 400 });
      }
      const result = RBAC.checkAccess(userId, permission as any);
      return NextResponse.json(result);
    }

    case "user": {
      const userId = searchParams.get("userId") || "admin-001";
      const assignment = RBAC.getUserAssignment(userId);
      if (!assignment) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const role = RBAC.getRole(assignment.role);
      return NextResponse.json({ ...assignment, roleDefinition: role });
    }

    case "stats": {
      return NextResponse.json(RBAC.getStats());
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "assign": {
        const { userId, userName, role, assignedBy } = body;
        if (!userId || !userName || !role) {
          return NextResponse.json({ error: "userId, userName, and role are required" }, { status: 400 });
        }

        // Validate role exists
        const roleDef = RBAC.getRole(role as RBACRole);
        if (!roleDef) {
          return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
        }

        const assignment = RBAC.assignUser(userId, userName, role as RBACRole, assignedBy || "admin-001");

        AuditTracker.record({
          eventType: "CONFIGURATION_CHANGED",
          actor: assignedBy || "admin-001",
          actorRole: "SYSTEM_ADMIN",
          targetId: userId,
          targetType: "USER",
          action: `Role assigned: ${userName} → ${roleDef.name}`,
          details: { userId, userName, role, previousAssignment: RBAC.getUserAssignment(userId) ? "updated" : "new" },
          ipAddress: "127.0.0.1",
          userAgent: "GenAI Platform",
          riskLevel: "INFO",
        });

        return NextResponse.json(assignment);
      }

      case "deactivate": {
        const { userId: deactivateUserId } = body;
        if (!deactivateUserId) {
          return NextResponse.json({ error: "userId required" }, { status: 400 });
        }

        const success = RBAC.deactivateUser(deactivateUserId);
        if (!success) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        AuditTracker.record({
          eventType: "CONFIGURATION_CHANGED",
          actor: body.assignedBy || "admin-001",
          actorRole: "SYSTEM_ADMIN",
          targetId: deactivateUserId,
          targetType: "USER",
          action: `User deactivated: ${deactivateUserId}`,
          details: { userId: deactivateUserId },
          ipAddress: "127.0.0.1",
          userAgent: "GenAI Platform",
          riskLevel: "MEDIUM",
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("RBAC API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
