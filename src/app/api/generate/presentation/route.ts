import { NextRequest, NextResponse } from "next/server";
import { HashChain } from "@/lib/hashchain";
import { generatePPTXFile } from "@/lib/pptx-generator";

/**
 * POST /api/generate/presentation
 * 
 * Generates a downloadable .pptx presentation from content.
 * 
 * Body: {
 *   title?: string,
 *   content: string,          // Source content to create slides from
 *   slideCount?: number,      // Target slide count (5-20, default auto)
 *   style?: string,           // "corporate" | "modern" | "academic" | "creative"
 *   accentColor?: string      // Hex color for accents
 * }
 * 
 * Returns the PPTX as a binary download.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title: rawTitle,
      content,
      slideCount: rawSlideCount,
      style = "corporate",
      accentColor = "0f3460",
    } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const title = rawTitle || content.split("\n")[0]?.substring(0, 60) || "Presentation";

    // Parse content into logical sections for slides
    const paragraphs = content.split(/\n\n+/).filter((p: string) => p.trim().length > 5);
    const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);

    // Determine slide count
    const targetSlides = Math.max(5, Math.min(20, rawSlideCount || Math.min(12, Math.max(5, paragraphs.length + 2))));

    // Build slide data
    const slides: Array<{
      title: string;
      content: string[];
      notes: string;
      layout: "title" | "content" | "twoColumn" | "conclusion";
      accentColor: string;
    }> = [];

    // Style-based color schemes
    const colorSchemes: Record<string, { primary: string; accent: string }> = {
      corporate: { primary: "0f3460", accent: "e94560" },
      modern: { primary: "1a1a2e", accent: "3b82f6" },
      academic: { primary: "1e3a5f", accent: "2ecc71" },
      creative: { primary: "2d1b69", accent: "e94560" },
    };
    const scheme = colorSchemes[style] || colorSchemes.corporate;
    const primaryColor = scheme.primary;
    const accent = accentColor || scheme.accent;

    // Slide 1: Title slide
    slides.push({
      title: title.substring(0, 60),
      content: [
        `${style.charAt(0).toUpperCase() + style.slice(1)} Presentation`,
        new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      ],
      notes: `Opening slide: ${title}. Style: ${style}.`,
      layout: "title",
      accentColor: primaryColor,
    });

    // Slide 2: Agenda/Overview (if enough content)
    if (paragraphs.length > 1) {
      const agendaItems = paragraphs.slice(1, 6).map((p: string) => {
        const firstSentence = p.split(/[.!\n]/)[0]?.trim() || "";
        return firstSentence.substring(0, 80);
      });
      slides.push({
        title: "Overview",
        content: agendaItems,
        notes: "Walk through the agenda items.",
        layout: "content",
        accentColor: accent,
      });
    }

    // Content slides from paragraphs
    const sourceForSlides = paragraphs.length > 2 ? paragraphs : sentences;
    const bulletPoints = sourceForSlides.slice(0, targetSlides * 3).map((s: string) =>
      s.trim().substring(0, 120)
    );

    const slideChunkSize = 4;
    for (let i = 0; i < Math.min(bulletPoints.length, (targetSlides - 3) * slideChunkSize); i += slideChunkSize) {
      const chunk = bulletPoints.slice(i, i + slideChunkSize);
      const slideNum = slides.length + 1;
      slides.push({
        title: `Key Details ${slideNum > 3 ? "(continued)" : ""}`,
        content: chunk.map((c: string) => c.replace(/^[-•*\d.]+\s*/, "")),
        notes: "Elaborate on each point with evidence and examples.",
        layout: "content",
        accentColor: [accent, primaryColor, "533483", "e94560"][(i / slideChunkSize) % 4],
      });
    }

    // Summary/Conclusion slide
    const topTakeaways = sentences.slice(0, 3).map((s: string) => s.trim().substring(0, 100));
    slides.push({
      title: "Summary & Next Steps",
      content: topTakeaways.length > 0
        ? topTakeaways.map((t: string, i: number) => `${i + 1}. ${t}`)
        : ["Key points reviewed", "Action items identified", "Next steps defined"],
      notes: "Summarize main points and assign action items.",
      layout: "conclusion",
      accentColor: accent,
    });

    // Generate the PPTX file
    const result = await generatePPTXFile(slides, title);

    // Record in hash chain
    HashChain.appendBlock({
      eventType: "GENERATION",
      actorId: body.userId || "system",
      sourceContent: `PPTX: ${title} (${result.slideCount} slides, ${style} style)`,
      metadata: {
        type: "pptx",
        title,
        slideCount: result.slideCount,
        style,
        accentColor: accent,
      },
    });

    // Return as binary download
    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "X-Slide-Count": String(result.slideCount),
        "X-Style": style,
      },
    });
  } catch (error) {
    console.error("Presentation generation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "Presentation Generation",
    provider: "Local PPTX generator (OOXML)",
    styles: ["corporate", "modern", "academic", "creative"],
    usage: "POST with { title?, content, slideCount?, style?, accentColor? }",
  });
}
