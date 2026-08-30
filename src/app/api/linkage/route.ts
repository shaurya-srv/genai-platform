import { NextRequest, NextResponse } from "next/server";
import { LinkageService, Platform } from "@/lib/linkage";
import { HashChain } from "@/lib/hashchain";
import { LinkedAccountDB } from "@/lib/db-adapter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    switch (action) {
      case "link": {
        const { platform } = body;
        if (!platform || !["linkedin", "twitter", "email"].includes(platform)) {
          return NextResponse.json({ error: "Valid platform required (linkedin, twitter, email)" }, { status: 400 });
        }

        const authUrl = LinkageService.getAuthUrl(platform as Platform, userId);
        return NextResponse.json({ success: true, authUrl, platform });
      }

      case "demo_link": {
        const { platform } = body;
        if (!platform || !["linkedin", "twitter", "email"].includes(platform)) {
          return NextResponse.json({ error: "Valid platform required" }, { status: 400 });
        }

        const account = LinkageService.demoLink(platform as Platform, userId);

        // Persist to database
        try {
          LinkedAccountDB.save({
            id: account.id, userId: account.userId, platform: account.platform,
            accountId: account.accountId, accountName: account.accountName,
            accessToken: account.accessToken, refreshToken: account.refreshToken,
            tokenExpiresAt: account.tokenExpiresAt, scope: account.scope,
            status: account.status, linkedAt: account.linkedAt, metadata: account.metadata,
          });
        } catch (e) { console.error('[DB] Failed to save linked account:', e); }

        HashChain.appendBlock({
          eventType: "ROLE_CHANGE",
          actorId: userId || "system",
          actorName: account.accountName,
          sourceContent: `Linked ${platform} account: ${account.accountName}`,
          metadata: { platform, accountId: account.id, demo: true },
        });

        return NextResponse.json({ success: true, account });
      }

      case "unlink": {
        const { accountId } = body;
        if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

        const success = LinkageService.unlinkAccount(accountId, userId);
        return NextResponse.json({ success });
      }

      case "publish": {
        const { accountId, platform, content, title, visibility } = body;
        if (!accountId || !platform || !content) {
          return NextResponse.json({ error: "accountId, platform, and content required" }, { status: 400 });
        }

        const result = await LinkageService.publish({
          accountId,
          platform: platform as Platform,
          content,
          title,
          visibility,
        });

        if (result.success) {
          HashChain.appendBlock({
            eventType: "PUBLISH",
            actorId: userId || "system",
            actorName: "System",
            sourceContent: content.substring(0, 200),
            metadata: { platform, postId: result.postId, postUrl: result.postUrl },
          });
        }

        return NextResponse.json(result);
      }

      case "auto_publish": {
        // Auto-publish after approval chain completes
        const { content, title, platforms } = body;
        if (!content || !title) {
          return NextResponse.json({ error: "content and title required" }, { status: 400 });
        }

        const results = await LinkageService.autoPublishAfterApproval(
          userId,
          content,
          title,
          platforms
        );

        HashChain.appendBlock({
          eventType: "PUBLISH",
          actorId: userId || "system",
          actorName: "System",
          sourceContent: `Auto-published: ${title}`,
          metadata: { results: results.map((r: any) => ({ platform: r.platform, success: r.success, postId: r.postId })) },
        });

        return NextResponse.json({ success: true, results });
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
  const action = searchParams.get("action") || "status";
  const userId = searchParams.get("userId") || "";

  switch (action) {
    case "status":
      return NextResponse.json(LinkageService.getConnectionStatus(userId));

    case "accounts":
      return NextResponse.json(LinkageService.getLinkedAccounts(userId));

    case "platforms":
      return NextResponse.json([
        { platform: "linkedin", name: "LinkedIn", icon: "💼", color: "#0A66C2" },
        { platform: "twitter", name: "X (Twitter)", icon: "🐦", color: "#1DA1F2" },
        { platform: "email", name: "Email", icon: "📧", color: "#EA4335" },
      ]);

    case "publish_log":
      return NextResponse.json(LinkageService.getPublishLog(userId));

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
