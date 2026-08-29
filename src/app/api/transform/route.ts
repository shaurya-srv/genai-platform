import { NextRequest, NextResponse } from "next/server";
import { ContentTransformer } from "@/lib/transformer";
import { OutputPluginRegistry } from "@/lib/output-plugins";
import { DLPScanner } from "@/lib/dlp-scanner";
import { ThreatAnalyzer } from "@/lib/threat-analyzer";
import { ComplianceChecker } from "@/lib/compliance-checker";
import { ImpactMetrics } from "@/lib/impact-metrics";
import { TranslationService } from "@/lib/translation";
import { AuditTracker } from "@/lib/audit-tracker";
import { blockchain } from "@/lib/blockchain";
import { PromptSanitizer } from "@/lib/prompt-guard";
import { HashChain } from "@/lib/hashchain";
import { generateSRT, generateSTIXBundle } from "@/lib/file-generators";
import { extractContext } from "@/lib/context-engine";
import { generatePPTXFile } from "@/lib/pptx-generator";
import { generateInfographicSVG } from "@/lib/infographic-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      // ==================== DLP SCAN ====================
      case "dlp_scan": {
        const { content } = body;
        const result = DLPScanner.scan(content);

        AuditTracker.record({
          eventType: "DLP_SCAN_COMPLETED",
          actor: "system",
          actorRole: "SYSTEM",
          targetId: "current",
          targetType: "CONTENT",
          action: `DLP scan completed - Risk: ${result.riskLevel}, Findings: ${result.patternsMatched}`,
          details: { riskLevel: result.riskLevel, findings: result.patternsMatched },
          ipAddress: "127.0.0.1",
          userAgent: "GenAI Platform",
          riskLevel: result.safe ? "INFO" : "MEDIUM",
        });

        return NextResponse.json(result);
      }

      // ==================== THREAT ANALYSIS ====================
      case "threat_analysis": {
        const { content } = body;
        const result = ThreatAnalyzer.analyze(content);

        AuditTracker.record({
          eventType: "THREAT_ANALYSIS_COMPLETED",
          actor: "system",
          actorRole: "SYSTEM",
          targetId: "current",
          targetType: "CONTENT",
          action: `Threat analysis completed - Level: ${result.overallRiskLevel}, Score: ${result.overallRiskScore}`,
          details: { riskLevel: result.overallRiskLevel, score: result.overallRiskScore, threats: result.threats.length },
          ipAddress: "127.0.0.1",
          userAgent: "GenAI Platform",
          riskLevel: result.overallRiskScore > 50 ? "HIGH" : result.overallRiskScore > 20 ? "MEDIUM" : "INFO",
        });

        return NextResponse.json(result);
      }

      // ==================== COMPLIANCE CHECK ====================
      case "compliance_check": {
        const { content } = body;
        const result = ComplianceChecker.check(content);

        AuditTracker.record({
          eventType: "COMPLIANCE_CHECK_COMPLETED",
          actor: "system",
          actorRole: "SYSTEM",
          targetId: "current",
          targetType: "CONTENT",
          action: `Compliance check - Score: ${result.score}, Violations: ${result.violations.length}`,
          details: { score: result.score, violations: result.violations.length, badges: result.badges.filter(b => b.earned).length },
          ipAddress: "127.0.0.1",
          userAgent: "GenAI Platform",
          riskLevel: result.compliant ? "INFO" : "MEDIUM",
        });

        return NextResponse.json(result);
      }

      // ==================== PROMPT INJECTION SCAN ====================
      case "sanitize": {
        const { content } = body;
        const result = PromptSanitizer.sanitize(content);

        AuditTracker.record({
          eventType: "PROMPT_INJECTION_SCAN",
          actor: "system",
          actorRole: "SYSTEM",
          targetId: "current",
          targetType: "CONTENT",
          action: `Prompt injection scan — Risk: ${result.riskLevel}, Threats: ${result.threatsFound}`,
          details: { riskLevel: result.riskLevel, threats: result.threatsFound, safe: result.safe },
          ipAddress: "127.0.0.1",
          userAgent: "GenAI Platform",
          riskLevel: result.safe ? "INFO" : (result.riskLevel === 'CRITICAL' ? 'HIGH' : result.riskLevel) as 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH',
        });

        return NextResponse.json(result);
      }

      // ==================== CONTENT TRANSFORMATION ====================
      case "transform": {
        const { content: rawContent, sourceContent, outputTypes: rawOutputTypes, config: rawConfig } = body;
        const inputContent = rawContent || sourceContent || '';
        if (!inputContent || typeof inputContent !== 'string') {
          return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Build TransformationConfig from the frontend's flat fields
        const outputTypes = Array.isArray(rawOutputTypes) && rawOutputTypes.length > 0
          ? rawOutputTypes
          : ['linkedin'];
        const cfg = {
          outputTypes,
          targetAudience: rawConfig?.audience || 'general',
          tone: rawConfig?.tone || 'formal',
          language: rawConfig?.language || 'en',
          detailLevel: rawConfig?.detail || 'standard',
          communicationObjective: rawConfig?.objective || 'inform',
          contentStyle: 'professional',
        };

        // Pre-sanitize content for prompt injection
        const sanitizeResult = PromptSanitizer.sanitize(inputContent);
        const safeContent = sanitizeResult.safe ? sanitizeResult.sanitizedContent : inputContent;

        const result = await ContentTransformer.transform(safeContent, cfg);

        // ========== GENERATE ADDITIONAL MEDIA ==========
        // Build a descriptive prompt from the source content for image/video generation
        const mediaPrompt = inputContent
          .split(/[.!?\n]+/)
          .filter((s: string) => s.trim().length > 10)
          .slice(0, 3)
          .join('. ')
          .substring(0, 200);

        // 1) AI Image via Pollinations.ai (free, no key)
        const imageSeed = Math.floor(Math.random() * 999999);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          `Professional infographic about: ${mediaPrompt}, cinematic lighting, high quality, 4k`
        )}?width=1024&height=576&nologo=true&seed=${imageSeed}`;

        // 2) Video storyboard (4 scenes via Pollinations.ai)
        const sentences = inputContent
          .split(/[.!?\n]+/)
          .filter((s: string) => s.trim().length > 10);
        const videoScenes = Array.from({ length: 4 }, (_, i) => {
          const sentence = sentences[i % sentences.length] || mediaPrompt;
          const sceneSeed = Math.floor(Math.random() * 999999);
          return {
            sceneNumber: i + 1,
            imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(
              `Cinematic scene: ${sentence.substring(0, 120)}, dramatic lighting, film still, 4k`
            )}?width=1024&height=576&nologo=true&seed=${sceneSeed}`,
            narration: sentence.substring(0, 150),
            duration: 4000,
          };
        });

        // 3) Presentation PPTX (binary -> base64 for JSON transport)
        let pptxBase64 = '';
        let pptxFileName = '';
        let pptxSlideCount = 0;
        try {
          // Build slides from the source content
          const paragraphs = inputContent.split(/\n\n+/).filter((p: string) => p.trim().length > 5);
          const pptxSlides: Array<{ title: string; content: string[]; notes: string; layout: 'title' | 'content' | 'conclusion'; accentColor: string }> = [];
          const titleText = inputContent.split('\n')[0]?.trim().substring(0, 60) || 'Presentation';
          const color = cfg.tone === 'urgent' ? 'e94560' : cfg.tone === 'formal' ? '0f3460' : '3b82f6';

          pptxSlides.push({
            title: titleText,
            content: [cfg.targetAudience || 'General Audience', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
            notes: 'Title slide',
            layout: 'title',
            accentColor: '1a1a2e',
          });

          const sourceForSlides = paragraphs.length > 2 ? paragraphs : sentences;
          const bullets = sourceForSlides.slice(0, 16).map((s: string) => s.trim().substring(0, 120));
          for (let i = 0; i < bullets.length; i += 4) {
            pptxSlides.push({
              title: `Key Details ${pptxSlides.length > 1 ? '(continued)' : ''}`,
              content: bullets.slice(i, i + 4).map((b: string) => b.replace(/^[-•*\d.]+\s*/, '')),
              notes: 'Elaborate on each point.',
              layout: 'content',
              accentColor: color,
            });
          }

          pptxSlides.push({
            title: 'Summary & Next Steps',
            content: sentences.slice(0, 3).map((s: string, i: number) => `${i + 1}. ${s.trim().substring(0, 100)}`),
            notes: 'Summarize.',
            layout: 'conclusion',
            accentColor: 'e94560',
          });

          const pptxResult = await generatePPTXFile(pptxSlides, titleText);
          pptxBase64 = pptxResult.buffer.toString('base64');
          pptxFileName = pptxResult.fileName;
          pptxSlideCount = pptxResult.slideCount;
        } catch (pptxErr) {
          console.error('PPTX generation failed:', pptxErr);
        }

        // Record on blockchain
        const sourceHash = blockchain.constructor === Object
          ? require("@/lib/blockchain").blockchain.constructor.hashContent(inputContent)
          : "hash";

        const blockchainRecord = await blockchain.recordTransformation(
          inputContent,
          JSON.stringify(result.results),
          cfg.outputTypes.join(", "),
          "operator",
          "LOW"
        );

        result.sourceHash = blockchainRecord.contentHash;

        // Add compliance badges
        const compliance = ComplianceChecker.check(inputContent);
        for (const badge of compliance.badges.filter(b => b.earned)) {
          await blockchain.addComplianceBadge(blockchainRecord.id, badge.name, "system");
        }

        AuditTracker.record({
          eventType: "TRANSFORMATION_COMPLETED",
          actor: "system",
          actorRole: "SYSTEM",
          targetId: result.id,
          targetType: "TRANSFORMATION",
          action: `Transformation completed - ${cfg.outputTypes.length} outputs generated`,
          details: {
            outputs: cfg.outputTypes,
            consistencyScore: result.consistencyScore,
            blockchainId: blockchainRecord.id,
          },
          ipAddress: "127.0.0.1",
          userAgent: "GenAI Platform",
          riskLevel: "INFO",
          blockchainTxHash: blockchainRecord.id,
        });

        return NextResponse.json({
          success: true,
          ...result,
          // Additional media
          media: {
            image: { url: imageUrl, prompt: mediaPrompt },
            video: { scenes: videoScenes, totalDuration: videoScenes.length * 4000 },
            presentation: pptxBase64
              ? { base64: pptxBase64, fileName: pptxFileName, slideCount: pptxSlideCount }
              : null,
          },
        });
      }

      // ==================== TRANSLATION ====================
      case "translate": {
        const { content, targetLanguage, sourceLanguage } = body;
        const result = await TranslationService.translate(content, targetLanguage, sourceLanguage);
        return NextResponse.json(result);
      }

      // ==================== IMPACT METRICS ====================
      case "impact_metrics": {
        const { content, outputType, config } = body;
        const report = ImpactMetrics.generateReport("current", content, outputType, config);
        return NextResponse.json(report);
      }      // ==================== CONTEXT EXTRACTION ====================
      case "extract_context": {
        const { content, targetAudience, tone } = body;
        const context = await extractContext(content || '', { targetAudience, tone });
        return NextResponse.json(context);
      }

      // ==================== FILE DOWNLOAD ====================
      case "generate_pptx": {
        const { slides, title } = body;
        const pptxSlides = (slides || []).map((s: any, i: number) => ({
          title: s.title || `Slide ${i + 1}`,
          content: Array.isArray(s.content) ? s.content : (s.content || '').split('\n').filter((l: string) => l.trim()),
          notes: s.notes || '',
          layout: s.layout || (i === 0 ? 'title' : 'content'),
        }));
        const result = await generatePPTXFile(pptxSlides, title || 'Presentation');
        HashChain.appendBlock({
          eventType: 'GENERATION',
          actorId: body.userId || 'system',
          sourceContent: `PPTX: ${title} (${result.slideCount} slides)`,
          metadata: { type: 'pptx', title, slideCount: result.slideCount },
        });
        return new NextResponse(new Uint8Array(result.buffer), {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'Content-Disposition': `attachment; filename="${result.fileName}"`,
            'X-Slide-Count': String(result.slideCount),
          },
        });
      }

      case "generate_srt": {
        const { scenes } = body;
        const srtContent = generateSRT(scenes || []);
        HashChain.appendBlock({
          eventType: 'GENERATION',
          actorId: body.userId || 'system',
          sourceContent: srtContent,
          metadata: { type: 'srt', sceneCount: (scenes || []).length },
        });
        return NextResponse.json({ content: srtContent, fileName: 'subtitles.srt', mimeType: 'application/x-subrip' });
      }

      case "generate_infographic": {
        const { title: infTitle, sections, colorScheme, subtitle, stats } = body;
        // Ensure all sections have required fields with defaults
        const safeSections = (sections || []).map((s: any, i: number) => ({
          headline: s.headline || s.title || `Section ${i + 1}`,
          content: s.content || s.text || '',
          icon: s.icon || ['📊', '🔍', '⚡', '🛡️', '📈', '🎯', '💡'][i % 7],
          dataPoint: s.dataPoint || undefined,
          color: s.color || ['#e94560', '#0f3460', '#16213e', '#533483', '#1a1a2e', '#2ecc71', '#f39c12'][i % 7],
          percentage: s.percentage || undefined,
        }));
        const svg = generateInfographicSVG({
          title: infTitle || 'Infographic',
          subtitle: subtitle || 'NTRO GenAI Platform',
          sections: safeSections,
          colorScheme: colorScheme || undefined,
          stats: stats || [],
        });
        HashChain.appendBlock({
          eventType: 'GENERATION',
          actorId: body.userId || 'system',
          sourceContent: `SVG: ${infTitle}`,
          metadata: { type: 'svg', title: infTitle, sectionCount: (sections || []).length },
        });
        return new NextResponse(svg, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Content-Disposition': 'attachment; filename="infographic.svg"',
          },
        });
      }

      case "generate_stix": {
        const { title: stixTitle, description, severity, sourceContent, recommendations } = body;
        const stix = generateSTIXBundle({ title: stixTitle || 'Advisory', description: description || '', severity: severity || 'MEDIUM', sourceContent: sourceContent || '', recommendations: recommendations || [] });
        HashChain.appendBlock({
          eventType: 'GENERATION',
          actorId: body.userId || 'system',
          sourceContent: JSON.stringify(stix),
          metadata: { type: 'stix', title: stixTitle, objectCount: stix.objects.length },
        });
        return NextResponse.json(stix);
      }

      default:
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Transform API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "GenAI Content Transformation API",
    version: "2.0.0",
    plugins: OutputPluginRegistry.getPluginSummaries(),
    endpoints: {
      "POST /api/transform": {
        actions: [
          "dlp_scan - Scan content for sensitive data",
          "threat_analysis - Analyze content for threats",
          "compliance_check - Check regulatory compliance",
          "sanitize - Scan for prompt injection attacks",
          "transform - Transform content to selected formats",
          "translate - Translate content to target language",
          "impact_metrics - Generate impact metrics report",
        ],
      },
    },
  });
}
