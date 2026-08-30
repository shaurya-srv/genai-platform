import { NextRequest, NextResponse } from "next/server";
import { PDFReportGenerator } from "@/lib/pdf-report";
import { ApprovalChainService } from "@/lib/approval-chain";
import { HashChain } from "@/lib/hashchain";
import { ComplianceChecker } from "@/lib/compliance-checker";
import { AuthService } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    switch (action) {
      case "approval_report": {
        const { requestId } = body;
        if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

        const req = ApprovalChainService.getRequest(requestId);
        if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });

        const user = AuthService.getUser(userId);
        const blob = PDFReportGenerator.generateApprovalReport({
          request: req as any,
          generatedBy: user?.displayName || userId,
        });

        return new Response(blob, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="approval-report-${req.id}.pdf"`,
          },
        });
      }

      case "audit_report": {
        const blocks = HashChain.getChain();
        const verification = HashChain.verifyChain();
        const user = AuthService.getUser(userId);

        const blob = PDFReportGenerator.generateAuditReport({
          blocks: blocks.map(b => ({
            blockNumber: b.blockNumber,
            eventType: b.eventType,
            actor: b.actorName,
            actorRole: b.actorRole,
            timestamp: b.timestamp,
            contentHash: b.contentHash,
            metadata: b.metadata as Record<string, any>,
          })),
          chainValid: verification.valid,
          generatedBy: user?.displayName || userId,
        });

        return new Response(blob, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="audit-report-${new Date().toISOString().split("T")[0]}.pdf"`,
          },
        });
      }

      case "compliance_report": {
        const { content, contentTitle } = body;
        if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

        const compliance = ComplianceChecker.check(content);
        const user = AuthService.getUser(userId);

        const blob = PDFReportGenerator.generateComplianceReport({
          contentTitle: contentTitle || "Content Compliance Report",
          checks: compliance.badges.map(b => ({
            regulation: b.name,
            status: b.earned ? "Compliant" : "Non-Compliant",
            score: b.earned ? 100 : 0,
            findings: b.description ? [b.description] : [],
          })),
          overallScore: compliance.score,
          generatedBy: user?.displayName || userId,
        });

        return new Response(blob, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="compliance-report-${new Date().toISOString().split("T")[0]}.pdf"`,
          },
        });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
