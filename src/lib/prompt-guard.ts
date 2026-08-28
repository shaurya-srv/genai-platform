/**
 * Prompt Injection Defense Sanitizer
 * 
 * Detects and neutralizes prompt injection attempts in user-supplied content.
 * Protects against:
 * - Direct prompt overrides ("ignore previous instructions")
 * - System prompt leakage attempts
 * - Indirect injection via URL content, document metadata, hidden text
 * - Jailbreak patterns and role-play attacks
 * - Data exfiltration attempts
 */

export interface SanitizeResult {
  safe: boolean;
  originalLength: number;
  sanitizedContent: string;
  threatsFound: number;
  threats: SanitizeThreat[];
  riskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SanitizeThreat {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  matchedPattern: string;
  position: number;
  description: string;
  action: 'redacted' | 'escaped' | 'blocked';
}

// ==================== INJECTION PATTERNS ====================

const INJECTION_PATTERNS: Array<{
  name: string;
  patterns: RegExp[];
  severity: SanitizeThreat['severity'];
  description: string;
  action: SanitizeThreat['action'];
}> = [
  // Direct prompt overrides
  {
    name: 'Direct Prompt Override',
    patterns: [
      /(?:ignore|disregard|forget|override|bypass|skip|neglect|drop|reset|clear|erase)\s+(?:all\s+)?(?:previous|prior|above|earlier|preceding|before)\s+(?:instructions?|prompts?|rules?|guidelines?|constraints?|directives?|orders?|commands?)/gi,
      /(?:from\s+now\s+on|starting\s+(?:now|from\s+here)|new\s+(?:instructions?|rules?|mode))/gi,
      /(?:you\s+are\s+now|act\s+as\s+(?:if|a|an)|pretend\s+(?:you(?:'re|\s+are)|to\s+be)|role\s*-?\s*play\s+(?:as|a|an)|simulate\s+(?:being|a|an))/gi,
    ],
    severity: 'CRITICAL',
    description: 'Direct prompt override attempt — tries to replace system instructions',
    action: 'redacted',
  },
  // System prompt leakage
  {
    name: 'System Prompt Leakage',
    patterns: [
      /(?:show|reveal|display|print|output|repeat|echo|tell\s+me|what\s+(?:is|are)|give\s+me|share)\s+(?:your\s+)?(?:system\s+(?:prompt|message|instructions?)|initial\s+prompt|hidden\s+(?:prompt|instructions?))/gi,
      /(?:what\s+(?:are|were)\s+you\s+(?:told|instructed|programmed)\s+to)|(?:(?:are|were)\s+you\s+(?:instructed|told|programmed)\s+to)/gi,
      /(?:your\s+(?:system\s+)?(?:prompt|instructions?)\s+(?:is|are|says?|contains?))/gi,
    ],
    severity: 'HIGH',
    description: 'System prompt leakage attempt — tries to extract system configuration',
    action: 'redacted',
  },
  // Role-play / persona hijacking
  {
    name: 'Persona Hijack',
    patterns: [
      /(?:you\s+are\s+(?:now\s+)?(?:DAN|STAN|DUDE|KEVIN|JAILBREAK|GPT[\s-]*4|a\s+(?:different|new|rogue|unrestricted|unfiltered)\s+(?:AI|model|assistant|version)))/gi,
      /(?:enter\s+(?:developer|debug|admin|maintenance|god|sudo|root)\s+mode)/gi,
      /(?:do\s+anything\s+now|DAN\s+mode|jailbreak\s+mode|developer\s+mode)/gi,
    ],
    severity: 'CRITICAL',
    description: 'Persona hijack / jailbreak attempt — tries to assume unauthorized role',
    action: 'redacted',
  },
  // Data exfiltration
  {
    name: 'Data Exfiltration',
    patterns: [
      /(?:send|transmit|forward|upload|post|email|exfiltrate|leak|share)\s+(?:all\s+)?(?:the\s+)?(?:data|content|information|text|files?|documents?|secrets?|credentials?|keys?|tokens?|passwords?)\s+(?:to|at|via|through)\s+/gi,
      /(?:curl|wget|fetch|http|post|get)\s+(?:https?:\/\/|ftp:\/\/)/gi,
      /(?:base64|b64)\s+(?:encode|decode|output)\s+(?:the\s+)?(?:content|data|information)/gi,
    ],
    severity: 'HIGH',
    description: 'Data exfiltration attempt — tries to send data to external destination',
    action: 'redacted',
  },
  // Code injection / execution
  {
    name: 'Code Injection',
    patterns: [
      /(?:execute|run|eval|exec|eval\s*\(|Function\s*\(|setTimeout\s*\(|setInterval\s*\()/gi,
      /(?:<script|javascript:|data:text\/html|onerror=|onload=|onclick=)/gi,
      /(?:__import__|require\s*\(|import\s*\(|subprocess|os\.system|exec\s*\()/gi,
    ],
    severity: 'HIGH',
    description: 'Code injection attempt — tries to execute arbitrary code',
    action: 'redacted',
  },
  // Prompt extraction / delimiter attacks
  {
    name: 'Delimiter Attack',
    patterns: [
      /(?:---+\s*(?:END|SYSTEM|USER|ASSISTANT|INST|INSTUCTION|PROMPT)\s*---+)/gi,
      /(?:<\|(?:im_start|im_end|endoftext|system|user|assistant)\|>)/gi,
      /\[(?:INST|SYSTEM|INSTUCTION)\]/gi,
      /###\s*(?:System|Instruction|Prompt|New)\s*:/gi,
    ],
    severity: 'HIGH',
    description: 'Delimiter attack — tries to inject section markers to hijack prompt structure',
    action: 'redacted',
  },
  // Encoding evasion
  {
    name: 'Encoding Evasion',
    patterns: [
      /(?:unicode|hex|base64|rot13|atob|btoa|url[- ]?encode|html[- ]?encode)\s*(?:encode|decode|escape|unescape)\s*/gi,
      /\\x[0-9a-f]{2}/gi,
      /&#x?[0-9a-f]+;?/gi,
    ],
    severity: 'MEDIUM',
    description: 'Encoding evasion — tries to use encoding to bypass content filters',
    action: 'escaped',
  },
  // Hidden text / zero-width characters
  {
    name: 'Hidden Text',
    patterns: [
      /[\u200B\u200C\u200D\uFEFF\u2060\u2061\u2062\u2063\u2064]/g,
      /(?:<div\s+style\s*=\s*["'](?:display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0|color\s*:\s*inherit)['"]>)/gi,
      /(?:\[hidden\]|\[invisible\]|\[skip\]|\[ignore\])/gi,
    ],
    severity: 'MEDIUM',
    description: 'Hidden text detected — contains invisible or hidden content',
    action: 'redacted',
  },
  // Indirect injection via meta/instructions
  {
    name: 'Indirect Injection',
    patterns: [
      /(?:when\s+(?:you|the\s+AI|the\s+model|an?\s+AI)\s+(?:sees?|reads?|processes?|receives?)\s+(?:this|the\s+following|the\s+text|the\s+content))/gi,
      /(?:important\s+(?:system|new|override)\s+(?:message|instruction|note|alert))/gi,
      /(?:AI\s*:\s*(?:ignore|disregard|override|new))/gi,
    ],
    severity: 'HIGH',
    description: 'Indirect injection — embedded instructions targeting AI processing',
    action: 'redacted',
  },
];

// ==================== SANITIZER CLASS ====================

export class PromptSanitizer {
  /**
   * Sanitize user input content to defend against prompt injection
   */
  static sanitize(content: string): SanitizeResult {
    const threats: SanitizeThreat[] = [];
    let sanitizedContent = content;

    for (const rule of INJECTION_PATTERNS) {
      for (const pattern of rule.patterns) {
        const regex = new RegExp(pattern.source, pattern.flags);
        const matches = sanitizedContent.matchAll(regex);

        for (const match of matches) {
          if (match.index !== undefined) {
            const threat: SanitizeThreat = {
              id: crypto.randomUUID(),
              type: rule.name,
              severity: rule.severity,
              matchedPattern: match[0].substring(0, 80),
              position: match.index,
              description: rule.description,
              action: rule.action,
            };
            threats.push(threat);

            // Apply mitigation
            if (rule.action === 'redacted') {
              sanitizedContent = sanitizedContent.replace(
                match[0],
                `[SANITIZED:${rule.name}]`
              );
            } else if (rule.action === 'escaped') {
              sanitizedContent = sanitizedContent.replace(
                match[0],
                match[0].split('').map(c => `&#${c.charCodeAt(0)};`).join('')
              );
            }
          }
        }
      }
    }

    // Additional: check for abnormally long "instruction-like" segments
    const segments = sanitizedContent.split(/\n\n+/);
    for (const segment of segments) {
      const trimmed = segment.trim();
      if (trimmed.length > 2000) {
        threats.push({
          id: crypto.randomUUID(),
          type: 'Oversized Segment',
          severity: 'MEDIUM',
          matchedPattern: `${trimmed.substring(0, 60)}... (${trimmed.length} chars)`,
          position: sanitizedContent.indexOf(trimmed),
          description: 'Unusually long segment may contain hidden injection payload',
          action: 'redacted',
        });
        // Truncate the segment
        sanitizedContent = sanitizedContent.replace(
          trimmed,
          trimmed.substring(0, 2000) + '\n[CONTENT TRUNCATED: Exceeded 2000 chars in single segment]'
        );
      }
    }

    const riskLevel = PromptSanitizer.calculateRiskLevel(threats);

    return {
      safe: threats.length === 0 || riskLevel === 'SAFE',
      originalLength: content.length,
      sanitizedContent,
      threatsFound: threats.length,
      threats,
      riskLevel,
    };
  }

  /**
   * Sanitize a URL's content (for URL ingestion)
   */
  static sanitizeUrlContent(content: string, url: string): SanitizeResult {
    // Prepend URL context for better detection
    const contextualContent = `[Source URL: ${url}]\n\n${content}`;
    const result = PromptSanitizer.sanitize(contextualContent);

    // Additional URL-specific checks
    const urlPatterns = [
      /(?:data:|javascript:|vbscript:)/gi,
    ];

    for (const pattern of urlPatterns) {
      if (pattern.test(url)) {
        result.threats.push({
          id: crypto.randomUUID(),
          type: 'Dangerous URL Scheme',
          severity: 'CRITICAL',
          matchedPattern: url.substring(0, 80),
          position: 0,
          description: 'URL uses a dangerous scheme that could execute code',
          action: 'blocked',
        });
        result.riskLevel = 'CRITICAL';
        result.safe = false;
      }
    }

    return result;
  }

  /**
   * Quick safety check without full sanitization
   */
  static isSafe(content: string): boolean {
    for (const rule of INJECTION_PATTERNS) {
      if (rule.severity === 'CRITICAL' || rule.severity === 'HIGH') {
        for (const pattern of rule.patterns) {
          if (pattern.test(content)) return false;
        }
      }
    }
    return true;
  }

  /**
   * Calculate risk level from threats
   */
  private static calculateRiskLevel(threats: SanitizeThreat[]): SanitizeResult['riskLevel'] {
    if (threats.length === 0) return 'SAFE';

    const maxSeverity = threats.reduce((max, t) => {
      const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      return levels.indexOf(t.severity) > levels.indexOf(max) ? t.severity : max;
    }, 'LOW' as SanitizeThreat['severity']);

    return maxSeverity;
  }

  /**
   * Get statistics about sanitization results
   */
  static getStats(results: SanitizeResult[]) {
    const allThreats = results.flatMap(r => r.threats);
    return {
      totalScans: results.length,
      safeCount: results.filter(r => r.safe).length,
      unsafeCount: results.filter(r => !r.safe).length,
      totalThreats: allThreats.length,
      byType: allThreats.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: allThreats.reduce((acc, t) => {
        acc[t.severity] = (acc[t.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
