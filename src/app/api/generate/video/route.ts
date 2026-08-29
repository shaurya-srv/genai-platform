import { NextRequest, NextResponse } from "next/server";
import { HashChain } from "@/lib/hashchain";

/**
 * POST /api/generate/video
 * 
 * Generates a video storyboard using Pollinations.ai scene images.
 * The frontend renders these as an animated slideshow with transitions.
 * 
 * Body: { 
 *   prompt: string,          // Source content / topic
 *   sceneCount?: number,     // Number of scenes (3-8, default 4)
 *   style?: string,          // Visual style
 *   aspectRatio?: string     // "16:9" or "9:16"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, sceneCount: rawSceneCount, style = "cinematic", aspectRatio = "16:9" } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const sceneCount = Math.max(3, Math.min(8, rawSceneCount || 4));

    // Determine dimensions from aspect ratio
    const dims = aspectRatio === "9:16"
      ? { width: 576, height: 1024 }
      : { width: 1024, height: 576 };

    // Extract key sentences/themes from the prompt for scene descriptions
    const sentences = prompt
      .split(/[.!?\n]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 10);

    // Generate scene prompts by extracting different aspects of the content
    const scenePrompts: string[] = [];
    const styleMap: Record<string, string> = {
      cinematic: "cinematic lighting, dramatic, film still, high quality, 4k",
      professional: "professional corporate style, clean design, modern, high quality",
      documentary: "documentary style, photojournalistic, realistic, high quality",
      animated: "animated style, vibrant colors, illustration, high quality",
      futuristic: "futuristic, sci-fi, neon, high tech, high quality",
    };
    const styleSuffix = styleMap[style] || styleMap.cinematic;

    for (let i = 0; i < sceneCount; i++) {
      const baseSentence = sentences[i % sentences.length] || prompt;
      // Create varied scene descriptions
      const sceneVerbs = [
        "Overview of",
        "Key details about",
        "Impact analysis of",
        "Detailed view of",
        "Summary of",
        "Critical aspects of",
        "Future outlook for",
        "In-depth look at",
      ];
      const verb = sceneVerbs[i % sceneVerbs.length];
      scenePrompts.push(
        `${verb} ${baseSentence.substring(0, 120)}, ${styleSuffix}`
      );
    }

    // Build scene objects with Pollinations URLs
    const scenes = scenePrompts.map((sp, i) => {
      const encoded = encodeURIComponent(sp);
      const params = new URLSearchParams({
        width: String(dims.width),
        height: String(dims.height),
        nologo: "true",
        seed: String(Math.floor(Math.random() * 999999)),
      });
      return {
        sceneNumber: i + 1,
        prompt: sp,
        imageUrl: `https://image.pollinations.ai/prompt/${encoded}?${params.toString()}`,
        duration: 4000, // 4 seconds per scene
        transition: i < sceneCount - 1 ? "fade" : "none",
        narration: sentences[i % sentences.length] || `Scene ${i + 1}`,
      };
    });

    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

    // Record in hash chain
    HashChain.appendBlock({
      eventType: "GENERATION",
      actorId: body.userId || "system",
      sourceContent: `Video storyboard: ${prompt.substring(0, 100)} (${sceneCount} scenes)`,
      metadata: {
        type: "video_storyboard",
        sceneCount,
        style,
        aspectRatio,
        totalDuration: `${totalDuration / 1000}s`,
      },
    });

    return NextResponse.json({
      success: true,
      storyboard: {
        title: prompt.substring(0, 80),
        style,
        aspectRatio,
        dimensions: dims,
        scenes,
        totalDuration,
        fps: 30,
      },
    });
  } catch (error) {
    console.error("Video generation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "AI Video Storyboard Generation",
    provider: "Pollinations.ai (scene images) + Client-side rendering",
    note: "Generates scene images server-side, renders as animated video in browser",
    styles: ["cinematic", "professional", "documentary", "animated", "futuristic"],
    usage: "POST with { prompt, sceneCount?, style?, aspectRatio? }",
  });
}
