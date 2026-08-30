import { NextRequest, NextResponse } from "next/server";
import { ContentScheduler } from "@/lib/scheduler";
import { LinkageService } from "@/lib/linkage";
import { HashChain } from "@/lib/hashchain";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    switch (action) {
      case "schedule": {
        const { title, content, platform, accountId, scheduledAt, timezone } = body;
        if (!title || !content || !platform || !accountId || !scheduledAt) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const account = LinkageService.getLinkedByPlatform(userId, platform);
        const accountName = account?.accountName || platform;

        const post = ContentScheduler.schedule({
          userId, title, content, platform, accountId, accountName,
          scheduledAt, timezone,
        });

        HashChain.appendBlock({
          eventType: "PUBLISH",
          actorId: userId,
          sourceContent: `Scheduled: ${title} → ${platform}`,
          metadata: { postId: post.id, platform, scheduledAt },
        });

        return NextResponse.json({ success: true, post });
      }

      case "schedule_multi": {
        const { title, content, platforms, scheduledAt, timezone, staggerMinutes } = body;
        if (!title || !content || !platforms?.length || !scheduledAt) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const posts = ContentScheduler.scheduleMulti({
          userId, title, content, platforms, scheduledAt, timezone, staggerMinutes,
        });

        return NextResponse.json({ success: true, posts });
      }

      case "cancel": {
        const { postId } = body;
        if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });
        const success = ContentScheduler.cancel(postId, userId);
        return NextResponse.json({ success });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "upcoming";
  const userId = searchParams.get("userId") || "";

  switch (action) {
    case "upcoming":
      return NextResponse.json(ContentScheduler.getUpcoming());
    case "mine":
      return NextResponse.json(ContentScheduler.getForUser(userId));
    case "all":
      return NextResponse.json(ContentScheduler.getAll());
    case "stats":
      return NextResponse.json(ContentScheduler.getStats());
    case "optimal": {
      const platform = (searchParams.get("platform") || "linkedin") as any;
      const optimal = ContentScheduler.getOptimalTime(platform);
      return NextResponse.json(optimal);
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
