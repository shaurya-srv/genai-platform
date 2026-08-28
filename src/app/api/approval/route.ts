import { NextRequest, NextResponse } from "next/server";
import { MultiSigApproval } from "@/lib/multisig";
import { RBAC } from "@/lib/rbac";
import { AuthService } from "@/lib/auth";
import { HashChain } from "@/lib/hashchain";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body;
    const actorId = userId || 'admin-001';

    switch (action) {
      case "create": {
        // RBAC: require content:submit permission
        const submitCheck = RBAC.checkAccess(actorId, 'content:submit');
        if (!submitCheck.allowed) {
          return NextResponse.json({ error: `Access denied: ${submitCheck.reason}` }, { status: 403 });
        }

        const { transformationId, requestedBy, outputType, threatLevel, complianceScore, dlpSafe } = body;
        const req = MultiSigApproval.createRequest(
          transformationId,
          requestedBy,
          outputType,
          threatLevel || "LOW",
          complianceScore || 100,
          dlpSafe !== false
        );
        return NextResponse.json(req);
      }

      case "approve": {
        const { requestId, approverId, approverName, role, approved, comments } = body;

        // RBAC: require approval:approve or approval:reject permission
        const perm = approved ? 'approval:approve' : 'approval:reject';
        const approveCheck = RBAC.checkAccess(actorId, perm);
        if (!approveCheck.allowed) {
          return NextResponse.json({ error: `Access denied: ${approveCheck.reason}` }, { status: 403 });
        }

        // SEPARATION OF DUTIES: Check that the approver is not the same as the submitter
        const req = MultiSigApproval.getRequest(requestId);
        if (req) {
          const sopCheck = AuthService.canApprove(req.requestedBy, approverId);
          if (!sopCheck.allowed) {
            HashChain.appendBlock({
              eventType: 'REJECTION',
              actorId: approverId,
              actorName: approverName,
              sourceContent: `Separation of duties violation: ${approverId} attempted to approve own submission`,
              metadata: { requestId, submitterId: req.requestedBy, violation: 'SELF_APPROVAL' },
            });
            return NextResponse.json({ error: sopCheck.reason }, { status: 403 });
          }
        }

        const approval = MultiSigApproval.submitApproval(
          requestId,
          approverId,
          approverName,
          role,
          approved ? "APPROVE" : "REJECT",
          comments || ""
        );

        // Record on hash-chain
        HashChain.appendBlock({
          eventType: approved ? 'APPROVAL' : 'REJECTION',
          actorId: approverId,
          actorName: approverName,
          sourceContent: JSON.stringify({ requestId, approved, role, comments }),
          metadata: { requestId, role, approved, transformationId: req?.transformationId },
        });

        return NextResponse.json({ success: true, approval });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "pending";

  switch (action) {
    case "pending":
      return NextResponse.json(MultiSigApproval.getPendingRequests());

    case "requirements": {
      const outputType = searchParams.get("outputType") || "linkedin";
      return NextResponse.json(MultiSigApproval.getRequirements(outputType));
    }

    case "roles":
      return NextResponse.json(MultiSigApproval.getRoles());

    case "stats":
      return NextResponse.json(MultiSigApproval.getStats());

    case "history": {
      const tid = searchParams.get("transformationId");
      if (tid) {
        return NextResponse.json(MultiSigApproval.getHistory(tid));
      }
      return NextResponse.json(MultiSigApproval.getAllHistory());
    }

    case "notifications": {
      const minutes = parseInt(searchParams.get("minutes") || "30");
      return NextResponse.json(MultiSigApproval.getRecentNotifications(minutes));
    }

    case "deadlines":
      return NextResponse.json(MultiSigApproval.getDeadlineStatuses());

    case "request": {
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
      const req = MultiSigApproval.getRequest(id);
      if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(req);
    }

    case "for-transformation": {
      const tid = searchParams.get("transformationId");
      if (!tid) return NextResponse.json({ error: "transformationId required" }, { status: 400 });
      return NextResponse.json(MultiSigApproval.getRequestsForTransformation(tid));
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
