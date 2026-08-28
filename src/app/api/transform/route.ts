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
import { generatePPTX, generateSRT, generateInfographicSVG, generateSTIXBundle } from "@/lib/file-generators";
import { extractContext } from "@/lib/context-engine";

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
        const { content, config } = body;

        // Pre-sanitize content for prompt injection
        const sanitizeResult = PromptSanitizer.sanitize(content);
        const safeContent = sanitizeResult.safe ? sanitizeResult.sanitizedContent : content;

        const result = await ContentTransformer.transform(safeContent, config);

        // Record on blockchain
        const sourceHash = blockchain.constructor === Object
          ? require("@/lib/blockchain").blockchain.constructor.hashContent(content)
          : "hash";

        const blockchainRecord = await blockchain.recordTransformation(
          content,
          JSON.stringify(result.results),
          config.outputTypes.join(", "),
          "operator",
          "LOW"
        );

        result.sourceHash = blockchainRecord.contentHash;

        // Add compliance badges
        const compliance = ComplianceChecker.check(content);
        for (const badge of compliance.badges.filter(b => b.earned)) {
          await blockchain.addComplianceBadge(blockchainRecord.id, badge.name, "system");
        }

        AuditTracker.record({
          eventType: "TRANSFORMATION_COMPLETED",
          actor: "system",
          actorRole: "SYSTEM",
          targetId: result.id,
          targetType: "TRANSFORMATION",
          action: `Transformation completed - ${config.outputTypes.length} outputs generated`,
          details: {
            outputs: config.outputTypes,
            consistencyScore: result.consistencyScore,
            blockchainId: blockchainRecord.id,
          },
          ipAddress: "127.0.0.1",
          userAgent: "GenAI Platform",
          riskLevel: "INFO",
          blockchainTxHash: blockchainRecord.id,
        });

        return NextResponse.json(result);
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
        const pptx = generatePPTX(slides || [], title || 'Presentation');
        HashChain.appendBlock({
          eventType: 'GENERATION',
          actorId: body.userId || 'system',
          sourceContent: JSON.stringify(pptx),
          metadata: { type: 'pptx', title, slideCount: pptx.totalSlides },
        });
        return NextResponse.json(pptx);
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
        const { title: infTitle, sections, colorScheme } = body;
        const svg = generateInfographicSVG({ title: infTitle || 'Infographic', sections: sections || [], colorScheme: colorScheme || { primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560', text: '#ffffff', bg: '#0f3460' } });
        HashChain.appendBlock({
          eventType: 'GENERATION',
          actorId: body.userId || 'system',
          sourceContent: svg,
          metadata: { type: 'svg', title: infTitle },
        });
        return NextResponse.json({ content: svg, fileName: 'infographic.svg', mimeType: 'image/svg+xml' });
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
