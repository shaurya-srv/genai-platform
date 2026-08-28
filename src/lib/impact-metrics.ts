/**
 * Impact Metrics Module
 * Measures communication effectiveness and transformation quality
 */

export interface ImpactReport {
  transformationId: string;
  metrics: {
    contentQuality: QualityMetrics;
    reachPotential: ReachMetrics;
    engagementPrediction: EngagementMetrics;
    seoMetrics: SEOMetrics;
    accessibilityScore: number;
    overallScore: number;
  };
  generatedAt: number;
}

export interface QualityMetrics {
  readabilityScore: number; // 0-100 (Flesch-Kincaid)
  wordCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  grade: string; // A-F
  readingLevel: string;
}

export interface ReachMetrics {
  estimatedImpressions: number;
  estimatedReach: number;
  bestPostingTimes: string[];
  targetAudienceMatch: number; // 0-100
}

export interface EngagementMetrics {
  predictedEngagementRate: number;
  viralityScore: number; // 0-100
  shareabilityScore: number; // 0-100
  callToActionStrength: number; // 0-100
}

export interface SEOMetrics {
  keywordDensity: Record<string, number>;
  metaDescriptionLength: number;
  headingStructure: boolean;
  internalLinks: number;
  externalLinks: number;
  readabilityGrade: string;
}

export class ImpactMetrics {
  /**
   * Generate comprehensive impact report for a transformation
   */
  static generateReport(
    transformationId: string,
    content: string,
    outputType: string,
    config: { targetAudience: string; tone: string }
  ): ImpactReport {
    const contentQuality = ImpactMetrics.analyzeQuality(content);
    const reachPotential = ImpactMetrics.analyzeReach(content, outputType, config);
    const engagementPrediction = ImpactMetrics.predictEngagement(content, outputType);
    const seoMetrics = ImpactMetrics.analyzeSEO(content);
    const accessibilityScore = ImpactMetrics.calculateAccessibility(content);

    const overallScore = Math.round(
      (contentQuality.readabilityScore +
        reachPotential.targetAudienceMatch +
        engagementPrediction.predictedEngagementRate * 10 +
        accessibilityScore) / 4
    );

    return {
      transformationId,
      metrics: {
        contentQuality,
        reachPotential,
        engagementPrediction,
        seoMetrics,
        accessibilityScore,
        overallScore: Math.min(100, Math.max(0, overallScore)),
      },
      generatedAt: Date.now(),
    };
  }

  private static analyzeQuality(content: string): QualityMetrics {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;

    // Simplified readability score
    const readabilityScore = Math.min(100, Math.max(0,
      100 - Math.abs(avgSentenceLength - 15) * 3 - Math.max(0, words.length - 500) * 0.05
    ));

    let grade: string;
    if (readabilityScore >= 90) grade = 'A';
    else if (readabilityScore >= 80) grade = 'B';
    else if (readabilityScore >= 70) grade = 'C';
    else if (readabilityScore >= 60) grade = 'D';
    else grade = 'F';

    let readingLevel: string;
    if (avgSentenceLength < 10) readingLevel = 'Elementary';
    else if (avgSentenceLength < 15) readingLevel = 'Middle School';
    else if (avgSentenceLength < 20) readingLevel = 'High School';
    else if (avgSentenceLength < 25) readingLevel = 'College';
    else readingLevel = 'Graduate';

    return {
      readabilityScore: Math.round(readabilityScore),
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageSentenceLength: Math.round(avgSentenceLength),
      grade,
      readingLevel,
    };
  }

  private static analyzeReach(
    content: string,
    outputType: string,
    config: { targetAudience: string; tone: string }
  ): ReachMetrics {
    const baseReach: Record<string, number> = {
      linkedin: 1500,
      twitter: 2000,
      video: 3000,
      infographic: 2500,
      presentation: 500,
      advisory: 800,
      executive_summary: 300,
      crisis_response: 5000,
    };

    const estimatedImpressions = baseReach[outputType] || 1000;
    const estimatedReach = Math.round(estimatedImpressions * 0.7);

    const bestTimes: Record<string, string[]> = {
      linkedin: ['Tuesday 8-10 AM', 'Wednesday 12-1 PM', 'Thursday 9-11 AM'],
      twitter: ['Monday 9 AM', 'Wednesday 12 PM', 'Friday 3 PM'],
      video: ['Tuesday 2-4 PM', 'Thursday 7-9 PM', 'Saturday 10 AM'],
      infographic: ['Tuesday 11 AM', 'Wednesday 2 PM', 'Thursday 10 AM'],
      presentation: ['Monday 10 AM', 'Wednesday 2 PM'],
      advisory: ['Any time - priority based'],
      executive_summary: ['Monday 9 AM', 'Friday 2 PM'],
      crisis_response: ['Immediate'],
    };

    return {
      estimatedImpressions,
      estimatedReach,
      bestPostingTimes: bestTimes[outputType] || ['Standard business hours'],
      targetAudienceMatch: config.targetAudience ? 80 : 50,
    };
  }

  private static predictEngagement(content: string, outputType: string): EngagementMetrics {
    const baseEngagement: Record<string, number> = {
      linkedin: 3.5,
      twitter: 1.5,
      video: 5.0,
      infographic: 4.0,
      presentation: 2.0,
      advisory: 1.0,
      executive_summary: 0.5,
      crisis_response: 8.0,
    };

    const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(content);
    const hasNumbers = /\d+/.test(content);
    const hasQuestions = /\?/.test(content);
    const length = content.length;

    let bonus = 0;
    if (hasEmoji) bonus += 5;
    if (hasNumbers) bonus += 3;
    if (hasQuestions) bonus += 4;
    if (length > 100 && length < 2000) bonus += 5;

    return {
      predictedEngagementRate: Math.min(10, (baseEngagement[outputType] || 2) + bonus * 0.1),
      viralityScore: Math.min(100, 30 + bonus * 5 + Math.random() * 10),
      shareabilityScore: Math.min(100, 40 + bonus * 3),
      callToActionStrength: hasQuestions ? 70 : 50,
    };
  }

  private static analyzeSEO(content: string): SEOMetrics {
    const words = content.split(/\s+/);
    const wordFreq: Record<string, number> = {};
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'it']);

    words.forEach(w => {
      const lower = w.toLowerCase().replace(/[^a-z]/g, '');
      if (lower.length > 3 && !stopWords.has(lower)) {
        wordFreq[lower] = (wordFreq[lower] || 0) + 1;
      }
    });

    const totalWords = words.length;
    const keywordDensity: Record<string, number> = {};
    Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([word, count]) => {
        keywordDensity[word] = Math.round((count / totalWords) * 100 * 100) / 100;
      });

    return {
      keywordDensity,
      metaDescriptionLength: Math.min(160, Math.round(content.substring(0, 160).length)),
      headingStructure: /^#{1,6}\s/m.test(content) || /^\d+\.\s/m.test(content),
      internalLinks: (content.match(/\]\(/g) || []).length,
      externalLinks: (content.match(/https?:\/\//g) || []).length,
      readabilityGrade: totalWords < 100 ? 'Too Short' : 'Good',
    };
  }

  private static calculateAccessibility(content: string): number {
    let score = 70; // Base score

    // Check for clear structure
    if (/\n\n/.test(content)) score += 5;
    if (/^\d+\.\s|^- \s|^\*\s/m.test(content)) score += 10; // Lists
    if (/[.!?]{2,}/.test(content)) score -= 5; // Excessive punctuation
    if (content.split('\n').some(l => l.length > 100)) score -= 5; // Long lines

    return Math.min(100, Math.max(0, score));
  }
}
