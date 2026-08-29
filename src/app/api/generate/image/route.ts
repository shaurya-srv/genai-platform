import { NextRequest, NextResponse } from "next/server";
import { HashChain } from "@/lib/hashchain";

/**
 * POST /api/generate/image
 * 
 * Generates AI images using Pollinations.ai (free, no API key).
 * Body: { prompt: string, width?: number, height?: number, model?: string, seed?: number }
 * 
 * Returns the image as a redirect to the Pollinations URL (for direct <img> use)
 * or as a JSON response with the URL.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, width = 1024, height = 1024, model, seed, nologo = true } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Build the Pollinations.ai image URL
    const encodedPrompt = encodeURIComponent(prompt);
    const params = new URLSearchParams({
      width: String(width),
      height: String(height),
      nologo: String(nologo),
    });
    if (model) params.set("model", model);
    if (seed !== undefined) params.set("seed", String(seed));
    // Add a random seed to ensure different images each time
    params.set("seed", String(seed ?? Math.floor(Math.random() * 999999)));

    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

    // Record in hash chain
    HashChain.appendBlock({
      eventType: "GENERATION",
      actorId: body.userId || "system",
      sourceContent: `Image: ${prompt.substring(0, 100)}`,
      metadata: { type: "image", prompt: prompt.substring(0, 200), width, height, model: model || "flux" },
    });

    return NextResponse.json({
      success: true,
      url: imageUrl,
      prompt,
      width,
      height,
      model: model || "flux",
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "AI Image Generation",
    provider: "Pollinations.ai",
    note: "Free, no API key required",
    models: ["flux", "flux-realism", "flux-anime", "flux-3d", "turbo"],
    usage: "POST with { prompt, width?, height?, model? }",
  });
}
