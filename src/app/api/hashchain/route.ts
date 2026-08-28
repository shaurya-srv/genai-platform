import { NextRequest, NextResponse } from "next/server";
import { HashChain } from "@/lib/hashchain";
import { AuditTracker } from "@/lib/audit-tracker";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "append": {
        const { eventType, actorId, sourceContent, metadata } = body;
        const block = HashChain.appendBlock({
          eventType: eventType || 'SUBMISSION',
          actorId: actorId || 'system',
          sourceContent: sourceContent || '',
          metadata: metadata || {},
        });
        return NextResponse.json({ success: true, block });
      }

      case "verify": {
        const result = HashChain.verifyChain();
        AuditTracker.record({
          eventType: "CHAIN_VERIFICATION",
          actor: body.actorId || 'system',
          actorRole: 'AUDITOR',
          targetId: 'chain',
          targetType: 'BLOCKCHAIN',
          action: `Chain verification: ${result.valid ? 'VALID' : 'BROKEN'} (${result.totalBlocks} blocks, ${result.brokenLinks} broken)`,
          details: result as unknown as Record<string, unknown>,
          ipAddress: '127.0.0.1',
          userAgent: 'GenAI Platform',
          riskLevel: result.valid ? 'INFO' : 'HIGH',
        });
        return NextResponse.json(result);
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
  const action = searchParams.get("action") || "chain";

  switch (action) {
    case "chain":
      return NextResponse.json(HashChain.getChain());

    case "stats":
      return NextResponse.json(HashChain.getStats());

    case "verify":
      return NextResponse.json(HashChain.verifyChain());

    case "blocks_by_type": {
      const eventType = searchParams.get("eventType");
      if (!eventType) return NextResponse.json({ error: "eventType required" }, { status: 400 });
      return NextResponse.json(HashChain.getBlocksByType(eventType as any));
    }

    case "blocks_for_transformation": {
      const tid = searchParams.get("transformationId");
      if (!tid) return NextResponse.json({ error: "transformationId required" }, { status: 400 });
      return NextResponse.json(HashChain.getBlocksForTransformation(tid));
    }

    case "block": {
      const blockId = searchParams.get("blockId");
      if (!blockId) return NextResponse.json({ error: "blockId required" }, { status: 400 });
      const block = HashChain.getBlock(blockId);
      if (!block) return NextResponse.json({ error: "Block not found" }, { status: 404 });
      return NextResponse.json(block);
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
