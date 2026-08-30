import { NextRequest, NextResponse } from "next/server";
import { ApprovalChainService } from "@/lib/approval-chain";
import { HashChain } from "@/lib/hashchain";
import { NotificationService } from "@/lib/notifications";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "timeline";

  switch (action) {
    case "timeline": {
      // Full approval chain timeline for all requests
      const requests = ApprovalChainService.getAllRequests();
      const timeline = requests.map(r => ({
        id: r.id,
        title: r.title,
        submittedBy: r.submittedByName,
        submittedAt: r.submittedAt,
        riskLevel: r.riskLevel,
        status: r.status,
        outputTypes: r.outputTypes,
        deadline: r.deadline,
        publishedAt: r.publishedAt,
        steps: r.chain.map(s => ({
          stepNumber: s.stepNumber,
          requiredRole: s.requiredRoleName,
          requiredLevel: s.requiredLevel,
          approver: s.approverName || null,
          decision: s.decision || null,
          decisionAt: s.decisionAt || null,
          comments: s.comments || null,
          status: s.status,
        })),
      }));
      return NextResponse.json(timeline);
    }

    case "chain_history": {
      // Hash chain audit trail
      const blocks = HashChain.getChain();
      const formatted = blocks.map(b => ({
        blockNumber: b.blockNumber,
        eventType: b.eventType,
        actor: b.actorName,
        actorRole: b.actorRole,
        timestamp: b.timestamp,
        contentHash: b.contentHash.substring(0, 16) + "...",
        metadata: b.metadata,
      }));
      return NextResponse.json(formatted);
    }

    case "stats": {
      const chainStats = HashChain.getStats();
      const approvalStats = ApprovalChainService.getStats();
      const allUsers = AuthService.getAllUsers();
      return NextResponse.json({
        chain: chainStats,
        approvals: approvalStats,
        users: allUsers.length,
        activeUsers: allUsers.filter(u => u.active).length,
      });
    }

    case "notifications": {
      const userId = searchParams.get("userId");
      const notifs = userId
        ? NotificationService.getForUser(userId)
        : NotificationService.getAll();
      return NextResponse.json(notifs.slice(0, 50));
    }

    case "verify_chain": {
      const result = HashChain.verifyChain();
      return NextResponse.json(result);
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
