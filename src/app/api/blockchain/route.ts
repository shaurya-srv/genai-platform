import { NextRequest, NextResponse } from "next/server";
import { blockchain } from "@/lib/blockchain";
import { AuditTracker } from "@/lib/audit-tracker";
import { MultiSigApproval } from "@/lib/multisig";
import { RBAC } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body;
    const actorId = userId || 'admin-001';

    switch (action) {
      // ==================== RECORD TRANSFORMATION ====================
      case "record": {
        const { transformationId, sourceContent, outputType } = body;

        const record = await blockchain.recordTransformation(
          sourceContent || "",
          JSON.stringify({ transformationId }),
          outputType || "unknown",
          body.operator || "system",
          body.threatLevel || "LOW"
        );

        AuditTracker.record({
          eventType: "BLOCKCHAIN_RECORD_CREATED",
          actor: body.operator || "system",
          actorRole: "SYSTEM",
          targetId: record.id,
          targetType: "BLOCKCHAIN",
          action: `Transformation recorded on blockchain`,
          details: { outputType, transformationId },
          ipAddress: "127.0.0.1",
          userAgent: "GenAI Platform",
          riskLevel: "INFO",
          blockchainTxHash: record.id,
        });

        return NextResponse.json({ success: true, record });
      }

      // ==================== VERIFY TRANSFORMATION ====================
      case "verify": {
        const { transformationId, outputHash } = body;
        const isValid = await blockchain.verifyTransformation(transformationId, outputHash);

        AuditTracker.record({
          eventType: "BLOCKCHAIN_VERIFICATION",
          actor: body.operator || "system",
          actorRole: "SECURITY_OFFICER",
          targetId: transformationId,
          targetType: "BLOCKCHAIN",
          action: `Verification: ${isValid ? "PASSED" : "FAILED"}`,
          details: { isValid, outputHash },
          ipAddress: "127.0.0.1",
          userAgent: "GenAI Platform",
          riskLevel: isValid ? "INFO" : "HIGH",
        });

        return NextResponse.json({ success: true, isValid });
      }

      // ==================== ADD COMPLIANCE BADGE ====================
      case "add_badge": {
        const { transformationId, badge } = body;
        await blockchain.addComplianceBadge(transformationId, badge, body.operator || "system");
        return NextResponse.json({ success: true });
      }

      // ==================== RECORD APPROVAL ====================
      case "approval": {
        const { transformationId, approver, role, approved, comments } = body;

        const approval = await MultiSigApproval.submitApproval(
          transformationId,
          approver,
          body.approverName || approver,
          role,
          approved ? "APPROVE" : "REJECT",
          comments || ""
        );

        // Also record on blockchain
        await blockchain.recordApproval(
          transformationId,
          approver,
          role,
          approved
        );

        AuditTracker.record({
          eventType: approved ? "APPROVAL_GRANTED" : "APPROVAL_REJECTED",
          actor: approver,
          actorRole: role,
          targetId: transformationId,
          targetType: "APPROVAL",
          action: `Approval ${approved ? "granted" : "rejected"} by ${role}`,
          details: { role, approved, comments },
          ipAddress: "127.0.0.1",
          userAgent: "GenAI Platform",
          riskLevel: "INFO",
        });

        return NextResponse.json({ success: true, approval });
      }

      // ==================== PUBLISH OUTPUT ====================
      case "publish": {
        // RBAC: require publish:create permission
        const publishCheck = RBAC.checkAccess(actorId, 'publish:create');
        if (!publishCheck.allowed) {
          return NextResponse.json({ error: `Access denied: ${publishCheck.reason}` }, { status: 403 });
        }

        const { transformationId } = body;
        const isPublished = await blockchain.publishOutput(
          transformationId,
          body.operator || "system"
        );

        AuditTracker.record({
          eventType: "CONTENT_PUBLISHED",
          actor: body.operator || "system",
          actorRole: "CONTENT_MANAGER",
          targetId: transformationId,
          targetType: "CONTENT",
          action: "Output published to external platform",
          details: { published: true },
          ipAddress: "127.0.0.1",
          userAgent: "GenAI Platform",
          riskLevel: "MEDIUM",
        });

        return NextResponse.json({ success: true, published: isPublished });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Blockchain API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "stats";

  switch (action) {
    case "stats":
      return NextResponse.json(blockchain.getStats());

    case "record": {
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
      const record = blockchain.getRecord(id);
      if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(record);
    }

    case "audit": {
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
      return NextResponse.json(blockchain.getAuditTrail(id));
    }

    case "approvals": {
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
      return NextResponse.json(blockchain.getApprovalChain(id));
    }

    case "all":
      return NextResponse.json(blockchain.getAllRecords());

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
