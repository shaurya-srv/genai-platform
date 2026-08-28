/**
 * Threat Analysis Panel
 * Analyzes source content for potential threats, risks, and security concerns
 * Provides comprehensive threat assessment before content transformation
 */

export type ThreatCategory =
  | 'MALICIOUS_CONTENT'
  | 'PHISHING'
  | 'DATA_EXFILTRATION'
  | 'INSIDER_THREAT'
  | 'SOCIAL_ENGINEERING'
  | 'COMPLIANCE_RISK'
  | 'REPUTATIONAL_RISK'
  | 'INFORMATION_DISCLOSURE';

export interface ThreatAnalysisResult {
  overallRiskLevel: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  overallRiskScore: number; // 0-100
  threats: ThreatFinding[];
  mitigations: string[];
  recommendations: ThreatRecommendation[];
  scanMetadata: {
    scanDuration: number;
    patternsChecked: number;
    categoriesAnalyzed: string[];
  };
}

export interface ThreatFinding {
  id: string;
  category: ThreatCategory;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  evidence: string;
  confidence: number; // 0-100
  mitigations: string[];
}

export interface ThreatRecommendation {
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  action: string;
  reason: string;
  affectedFindings: string[];
}

// Threat detection patterns
const THREAT_PATTERNS: Array<{
  category: ThreatCategory;
  title: string;
  description: string;
  pattern: RegExp;
  severity: ThreatFinding['severity'];
  confidence: number;
  mitigations: string[];
}> = [
  // Malicious Content
  {
    category: 'MALICIOUS_CONTENT',
    title: 'Potentially Malicious URL Detected',
    description: 'Content contains URLs that may lead to malicious resources',
    pattern: /\b(?:bit\.ly|tinyurl|t\.co|goo\.gl|is\.gd|short\.to|cutt\.ly)\S*/gi,
    severity: 'MEDIUM',
    confidence: 70,
    mitigations: ['Verify URL destinations before including in output', 'Use full URLs instead of shortened ones'],
  },
  {
    category: 'MALICIOUS_CONTENT',
    title: 'Script Injection Attempt',
    description: 'Content contains potential script injection patterns',
    pattern: /<script[\s>]|javascript:|on\w+\s*=\s*["']|eval\s*\(|document\.(cookie|write)/gi,
    severity: 'HIGH',
    confidence: 90,
    mitigations: ['Sanitize all HTML content', 'Strip script tags and event handlers', 'Use content security policies'],
  },
  // Phishing Indicators
  {
    category: 'PHISHING',
    title: 'Phishing Language Pattern',
    description: 'Content contains language patterns common in phishing attempts',
    pattern: /\b(?:verify\s+(?:your|account|identity)|urgent\s+(?:action|response|required)|account\s+(?:suspended|locked|compromised)|click\s+(?:here|immediately|now)|confirm\s+(?:your|identity|details))\b/gi,
    severity: 'MEDIUM',
    confidence: 65,
    mitigations: ['Review content for social engineering tactics', 'Verify the legitimacy of urgency claims'],
  },
  {
    category: 'PHISHING',
    title: 'Credential Harvesting Pattern',
    description: 'Content may be designed to harvest credentials',
    pattern: /\b(?:enter\s+(?:your|username|password|credentials|OTP|pin)|login\s+(?:here|page|credentials)|update\s+(?:payment|billing|account)\s+(?:info|details))\b/gi,
    severity: 'HIGH',
    confidence: 75,
    mitigations: ['Do not include credential collection mechanisms', 'Report potential phishing content'],
  },
  // Data Exfiltration
  {
    category: 'DATA_EXFILTRATION',
    title: 'Data Exfiltration Indicators',
    description: 'Content may contain patterns suggesting data exfiltration',
    pattern: /\b(?:upload\s+(?:all|entire|database|backup)|send\s+(?:to|via)\s+(?:external|personal|anonymous)|copy\s+(?:database|records|files)\s+to)\b/gi,
    severity: 'HIGH',
    confidence: 80,
    mitigations: ['Investigate data movement patterns', 'Verify authorization for data transfers'],
  },
  {
    category: 'DATA_EXFILTRATION',
    title: 'Bulk Data Reference',
    description: 'Content references large-scale data operations',
    pattern: /\b(?:bulk\s+(?:export|download|transfer|extract)|entire\s+(?:database|dataset|table|collection)|all\s+(?:records|entries|users|data))\b/gi,
    severity: 'MEDIUM',
    confidence: 60,
    mitigations: ['Verify authorization for bulk operations', 'Implement data loss prevention controls'],
  },
  // Insider Threat
  {
    category: 'INSIDER_THREAT',
    title: 'Privileged Access Abuse Pattern',
    description: 'Content suggests potential misuse of privileged access',
    pattern: /\b(?:bypass\s+(?:security|access|control|check)|disable\s+(?:logging|audit|monitoring)|override\s+(?:access|permission|restriction))\b/gi,
    severity: 'HIGH',
    confidence: 85,
    mitigations: ['Review access control policies', 'Enable comprehensive audit logging', 'Investigate potential insider threat'],
  },
  // Social Engineering
  {
    category: 'SOCIAL_ENGINEERING',
    title: 'Authority Impersonation',
    description: 'Content may attempt to impersonate authority figures',
    pattern: /\b(?:as\s+(?:directed|ordered|instructed)\s+by|(?:CEO|director|admin|authority)\s+(?:directly\s+)?(?:said|instructed|ordered|requested)|(?:immediate|direct)\s+(?:order|command|instruction))\b/gi,
    severity: 'MEDIUM',
    confidence: 60,
    mitigations: ['Verify claims of authority through official channels', 'Implement proper verification procedures'],
  },
  {
    category: 'SOCIAL_ENGINEERING',
    title: 'Urgency/Pressure Tactics',
    description: 'Content uses high-pressure tactics to bypass security',
    pattern: /\b(?:immediate(?:ly)?|urgent(?:ly)?|asap|right\s+now|no\s+time|don'?t\s+(?:wait|delay|tell|ask)|bypass\s+(?:normal|standard|usual)\s+(?:procedure|process|channel))\b/gi,
    severity: 'LOW',
    confidence: 50,
    mitigations: ['Follow standard verification procedures regardless of urgency claims'],
  },
  // Compliance Risk
  {
    category: 'COMPLIANCE_RISK',
    title: 'Regulatory Non-Compliance Risk',
    description: 'Content may violate data protection regulations',
    pattern: /\b(?:without\s+(?:consent|permission|authorization)|ignore\s+(?:privacy|regulation|compliance|gdpr)|share\s+(?:personal|private|sensitive)\s+(?:data|info))\b/gi,
    severity: 'HIGH',
    confidence: 75,
    mitigations: ['Ensure compliance with DPDP Act 2023', 'Obtain proper consent before data processing', 'Consult legal team'],
  },
  // Reputational Risk
  {
    category: 'REPUTATIONAL_RISK',
    title: 'Potentially Damaging Content',
    description: 'Content may pose reputational risks if published',
    pattern: /\b(?:leak|exposed|embarrassing|scandal|controversy|fraud|corruption|cover.?up|whistleblow)\b/gi,
    severity: 'MEDIUM',
    confidence: 55,
    mitigations: ['Review content for reputational impact', 'Consult communications team before publication', 'Consider alternative framing'],
  },
  // Information Disclosure
  {
    category: 'INFORMATION_DISCLOSURE',
    title: 'Sensitive System Information',
    description: 'Content may disclose sensitive system architecture details',
    pattern: /\b(?:internal\s+(?:ip|server|hostname|domain)|admin\s+(?:panel|interface|console|url)|root\s+(?:password|access|server)|database\s+(?:connection|string|credentials))\b/gi,
    severity: 'HIGH',
    confidence: 80,
    mitigations: ['Remove internal system details', 'Replace with generic references', 'Review information classification'],
  },
  {
    category: 'INFORMATION_DISCLOSURE',
    title: 'Source Code Disclosure Risk',
    description: 'Content may expose source code or technical implementation details',
    pattern: /\b(?:source\s+code|api[_\s]?(?:key|secret|token)|private[_\s]?key|secret[_\s]?key|database[_\s]?string)\s*[:=]\s*\S+/gi,
    severity: 'CRITICAL',
    confidence: 90,
    mitigations: ['CRITICAL: Remove all source code and secrets', 'Rotate any exposed credentials immediately', 'Conduct security review'],
  },
];

export class ThreatAnalyzer {
  /**
   * Analyze content for threats
   */
  static analyze(content: string): ThreatAnalysisResult {
    const startTime = Date.now();
    const threats: ThreatFinding[] = [];

    for (const rule of THREAT_PATTERNS) {
      const matches = content.matchAll(rule.pattern);
      for (const match of matches) {
        threats.push({
          id: crypto.randomUUID(),
          category: rule.category,
          severity: rule.severity,
          title: rule.title,
          description: rule.description,
          evidence: match[0].substring(0, 50),
          confidence: rule.confidence,
          mitigations: rule.mitigations,
        });
      }
    }

    // Deduplicate by category + title
    const uniqueThreats = ThreatAnalyzer.deduplicateThreats(threats);

    // Calculate overall risk
    const overallRiskScore = ThreatAnalyzer.calculateRiskScore(uniqueThreats);
    const overallRiskLevel = ThreatAnalyzer.getRiskLevel(overallRiskScore);

    // Generate mitigations
    const mitigations = ThreatAnalyzer.generateMitigations(uniqueThreats);

    // Generate recommendations
    const recommendations = ThreatAnalyzer.generateRecommendations(uniqueThreats);

    return {
      overallRiskLevel,
      overallRiskScore,
      threats: uniqueThreats,
      mitigations,
      recommendations,
      scanMetadata: {
        scanDuration: Date.now() - startTime,
        patternsChecked: THREAT_PATTERNS.length,
        categoriesAnalyzed: [...new Set(THREAT_PATTERNS.map(t => t.category))],
      },
    };
  }

  /**
   * Deduplicate threats by category and title
   */
  private static deduplicateThreats(threats: ThreatFinding[]): ThreatFinding[] {
    const seen = new Map<string, ThreatFinding>();
    for (const threat of threats) {
      const key = `${threat.category}-${threat.title}`;
      const existing = seen.get(key);
      if (!existing || threat.confidence > existing.confidence) {
        seen.set(key, threat);
      }
    }
    return Array.from(seen.values());
  }

  /**
   * Calculate risk score from threats
   */
  private static calculateRiskScore(threats: ThreatFinding[]): number {
    if (threats.length === 0) return 0;

    const severityWeights: Record<string, number> = {
      INFO: 1,
      LOW: 5,
      MEDIUM: 15,
      HIGH: 30,
      CRITICAL: 50,
    };

    const totalWeight = threats.reduce((sum, t) => {
      return sum + (severityWeights[t.severity] || 0) * (t.confidence / 100);
    }, 0);

    return Math.min(100, Math.round(totalWeight));
  }

  /**
   * Get risk level from score
   */
  private static getRiskLevel(score: number): ThreatAnalysisResult['overallRiskLevel'] {
    if (score === 0) return 'MINIMAL';
    if (score < 15) return 'LOW';
    if (score < 35) return 'MEDIUM';
    if (score < 70) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Generate mitigations from threats
   */
  private static generateMitigations(threats: ThreatFinding[]): string[] {
    const allMitigations = new Set<string>();
    for (const threat of threats) {
      for (const mit of threat.mitigations) {
        allMitigations.add(mit);
      }
    }
    return Array.from(allMitigations);
  }

  /**
   * Generate priority recommendations
   */
  private static generateRecommendations(threats: ThreatFinding[]): ThreatRecommendation[] {
    const recs: ThreatRecommendation[] = [];

    const critical = threats.filter(t => t.severity === 'CRITICAL');
    const high = threats.filter(t => t.severity === 'HIGH');
    const medium = threats.filter(t => t.severity === 'MEDIUM');

    if (critical.length > 0) {
      recs.push({
        priority: 'P1',
        action: 'Block content transformation immediately and conduct security review',
        reason: `${critical.length} CRITICAL threat(s) detected`,
        affectedFindings: critical.map(t => t.id),
      });
    }

    if (high.length > 0) {
      recs.push({
        priority: 'P2',
        action: 'Apply DLP sanitization and review flagged content manually',
        reason: `${high.length} HIGH severity threat(s) detected`,
        affectedFindings: high.map(t => t.id),
      });
    }

    if (medium.length > 0) {
      recs.push({
        priority: 'P3',
        action: 'Review flagged content and apply recommended mitigations',
        reason: `${medium.length} MEDIUM severity threat(s) detected`,
        affectedFindings: medium.map(t => t.id),
      });
    }

    if (threats.length === 0) {
      recs.push({
        priority: 'P4',
        action: 'Content appears safe - proceed with transformation',
        reason: 'No threats detected in source content',
        affectedFindings: [],
      });
    }

    return recs;
  }
}
