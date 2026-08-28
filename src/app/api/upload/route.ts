import { NextRequest, NextResponse } from "next/server";
import { PromptSanitizer } from "@/lib/prompt-guard";
import { AuditTracker } from "@/lib/audit-tracker";

/**
 * POST /api/upload
 * 
 * Handles:
 * - File uploads (PDF, DOCX, TXT, images) as base64
 * - URL content fetching
 * - Content sanitization via prompt injection defense
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      // ==================== FILE UPLOAD ====================
      case "file": {
        const { fileName, fileContent, fileType } = body;

        if (!fileContent) {
          return NextResponse.json({ error: "No file content provided" }, { status: 400 });
        }

        let extractedText = "";

        // Decode base64 content
        const buffer = Buffer.from(fileContent, "base64");
        const contentStr = buffer.toString("utf-8");

        switch (fileType) {
          case "text/plain":
          case "text/markdown":
          case "text/csv":
          case "application/json": {
            extractedText = contentStr;
            break;
          }

          case "application/pdf": {
            // Extract text from PDF — simple text extraction from PDF stream
            // Look for text between BT and ET markers
            const textMatches = contentStr.match(/BT[\s\S]*?ET/g) || [];
            const rawText = textMatches
              .map(block => {
                const strings = block.match(/\(([^)]+)\)/g) || [];
                return strings.map(s => s.slice(1, -1)).join(" ");
              })
              .join("\n");
            extractedText = rawText || `[PDF content: ${fileName} — ${buffer.length} bytes. Text extraction yielded no readable content. Consider converting to text first.]`;
            break;
          }

          case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          case "application/msword": {
            // DOCX/DOC — extract text from XML content
            const xmlTextMatches = contentStr.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
            extractedText = xmlTextMatches
              .map(match => match.replace(/<[^>]+>/g, ""))
              .join(" ");
            if (!extractedText) {
              extractedText = `[DOCX content: ${fileName} — ${buffer.length} bytes. Text extraction yielded no readable content.]`;
            }
            break;
          }

          case "image/png":
          case "image/jpeg":
          case "image/jpg":
          case "image/gif":
          case "image/webp": {
            // Image — provide metadata for downstream OCR if available
            extractedText = `[Image file uploaded: ${fileName} (${fileType}, ${(buffer.length / 1024).toFixed(1)} KB). Image content requires OCR processing. Please describe the image content or extract text manually.]`;
            break;
          }

          default: {
            // Try to read as text for unknown types
            extractedText = contentStr.length > 100000
              ? contentStr.substring(0, 100000)
              : contentStr;
            break;
          }
        }

        // Sanitize the extracted text
        const sanitizeResult = PromptSanitizer.sanitize(extractedText);

        AuditTracker.record({
          eventType: "FILE_UPLOAD",
          actor: "user",
          actorRole: "OPERATOR",
          targetId: fileName,
          targetType: "FILE",
          action: `File uploaded: ${fileName} (${fileType}) — ${sanitizeResult.threatsFound} injection threats detected`,
          details: {
            fileName,
            fileType,
            originalSize: buffer.length,
            extractedLength: extractedText.length,
            sanitizeRiskLevel: sanitizeResult.riskLevel,
            threatsFound: sanitizeResult.threatsFound,
          },
          ipAddress: "127.0.0.1",
          userAgent: "GenAI Platform",
          riskLevel: sanitizeResult.safe ? "INFO" : (sanitizeResult.riskLevel === 'CRITICAL' ? 'HIGH' : sanitizeResult.riskLevel === 'SAFE' ? 'INFO' : sanitizeResult.riskLevel) as 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH',
        });

        return NextResponse.json({
          success: true,
          content: sanitizeResult.safe ? sanitizeResult.sanitizedContent : extractedText,
          safe: sanitizeResult.safe,
          threatsFound: sanitizeResult.threatsFound,
          riskLevel: sanitizeResult.riskLevel,
          threats: sanitizeResult.threats,
          metadata: {
            fileName,
            fileType,
            originalSize: buffer.length,
            extractedLength: extractedText.length,
          },
        });
      }

      // ==================== URL CONTENT FETCH ====================
      case "url": {
        const { url } = body;

        if (!url) {
          return NextResponse.json({ error: "No URL provided" }, { status: 400 });
        }

        // Validate URL
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(url);
          if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return NextResponse.json({ error: "Only HTTP/HTTPS URLs are supported" }, { status: 400 });
          }
        } catch {
          return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
        }

        // Check for dangerous URL schemes
        const sanitizeUrl = PromptSanitizer.sanitizeUrlContent(url, url);
        if (!sanitizeUrl.safe) {
          return NextResponse.json({
            error: "URL flagged as potentially dangerous",
            threats: sanitizeUrl.threats,
          }, { status: 400 });
        }

        try {
          const response = await fetch(url, {
            headers: {
              "User-Agent": "GenAI-Platform/2.0",
              "Accept": "text/html,text/plain,text/markdown,*/*",
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });

          if (!response.ok) {
            return NextResponse.json({
              error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
            }, { status: 422 });
          }

          const contentType = response.headers.get("content-type") || "";
          const rawText = await response.text();

          // Strip HTML tags if HTML content
          let extractedText = rawText;
          if (contentType.includes("html")) {
            // Remove scripts and styles
            extractedText = rawText
              .replace(/<script[\s\S]*?<\/script>/gi, "")
              .replace(/<style[\s\S]*?<\/style>/gi, "")
              .replace(/<nav[\s\S]*?<\/nav>/gi, "")
              .replace(/<header[\s\S]*?<\/header>/gi, "")
              .replace(/<footer[\s\S]*?<\/footer>/gi, "")
              .replace(/<aside[\s\S]*?<\/aside>/gi, "");
            // Remove all remaining HTML tags
            extractedText = extractedText.replace(/<[^>]+>/g, " ");
            // Decode HTML entities
            extractedText = extractedText
              .replace(/&nbsp;/g, " ")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
            // Collapse whitespace
            extractedText = extractedText.replace(/\s+/g, " ").trim();
          }

          // Truncate very long content
          if (extractedText.length > 500000) {
            extractedText = extractedText.substring(0, 500000) + "\n\n[Content truncated at 500KB]";
          }

          // Sanitize for prompt injection
          const sanitizeResult = PromptSanitizer.sanitizeUrlContent(extractedText, url);

          AuditTracker.record({
            eventType: "URL_FETCH",
            actor: "user",
            actorRole: "OPERATOR",
            targetId: url,
            targetType: "URL",
            action: `URL fetched: ${url} — ${sanitizeResult.threatsFound} injection threats detected`,
            details: {
              url,
              contentType,
              fetchedLength: rawText.length,
              extractedLength: extractedText.length,
              sanitizeRiskLevel: sanitizeResult.riskLevel,
              threatsFound: sanitizeResult.threatsFound,
            },
            ipAddress: "127.0.0.1",
            userAgent: "GenAI Platform",
            riskLevel: sanitizeResult.safe ? "INFO" : "MEDIUM",
          });

          return NextResponse.json({
            success: true,
            content: sanitizeResult.safe ? sanitizeResult.sanitizedContent : extractedText,
            safe: sanitizeResult.safe,
            threatsFound: sanitizeResult.threatsFound,
            riskLevel: sanitizeResult.riskLevel,
            threats: sanitizeResult.threats,
            metadata: {
              url,
              contentType,
              fetchedLength: rawText.length,
              extractedLength: extractedText.length,
            },
          });
        } catch (fetchError) {
          return NextResponse.json({
            error: `Failed to fetch URL: ${String(fetchError)}`,
          }, { status: 500 });
        }
      }

      default:
        return NextResponse.json({ error: "Unknown action. Use 'file' or 'url'." }, { status: 400 });
    }
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "File Upload & URL Ingestion API",
    version: "1.0.0",
    endpoints: {
      "POST /api/upload": {
        actions: [
          "file - Upload a file (base64 encoded content, fileName, fileType)",
          "url - Fetch and extract content from a URL",
        ],
        supportedFileTypes: [
          "text/plain",
          "text/markdown",
          "text/csv",
          "application/json",
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
          "image/png",
          "image/jpeg",
          "image/gif",
          "image/webp",
        ],
      },
    },
  });
}
