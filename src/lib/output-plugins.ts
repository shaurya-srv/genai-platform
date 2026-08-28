/**
 * Output Plugin Architecture
 * 
 * A plugin-based system for output types. Each output format is registered as a plugin
 * with metadata, a transform function, and optional configuration. New output types can
 * be added by simply registering a new plugin — no changes to the core engine needed.
 */

import { TransformationConfig, TransformationResult } from './transformer';

// ==================== PLUGIN INTERFACE ====================

export interface OutputPlugin {
  /** Unique identifier (e.g., "linkedin", "video") */
  id: string;
  /** Display name (e.g., "LinkedIn Post") */
  name: string;
  /** Emoji icon for UI */
  icon: string;
  /** Short description for UI cards */
  description: string;
  /** Theme color hex for UI */
  color: string;
  /** Category for grouping in UI */
  category: 'social' | 'document' | 'media' | 'crisis' | 'analytics';
  /** Whether this plugin is enabled by default */
  enabled: boolean;
  /** Approval config overrides (uses multisig defaults if omitted) */
  approvalConfig?: {
    requiredApprovals?: number;
    deadlineHours?: number;
    roles?: string[];
  };
  /** Transform source content into this output format */
  transform: (source: string, config: TransformationConfig) => TransformationResult;
}

// ==================== PLUGIN REGISTRY ====================

export class OutputPluginRegistry {
  private static plugins: Map<string, OutputPlugin> = new Map();
  private static initialized = false;

  /**
   * Register a new output plugin (or overwrite an existing one with the same id)
   */
  static register(plugin: OutputPlugin): void {
    OutputPluginRegistry.plugins.set(plugin.id, plugin);
  }

  /**
   * Unregister a plugin by id
   */
  static unregister(id: string): boolean {
    return OutputPluginRegistry.plugins.delete(id);
  }

  /**
   * Get a plugin by id
   */
  static get(id: string): OutputPlugin | undefined {
    return OutputPluginRegistry.plugins.get(id);
  }

  /**
   * Get all registered plugins
   */
  static getAll(): OutputPlugin[] {
    return Array.from(OutputPluginRegistry.plugins.values());
  }

  /**
   * Get only enabled plugins
   */
  static getEnabled(): OutputPlugin[] {
    return OutputPluginRegistry.getAll().filter(p => p.enabled);
  }

  /**
   * Get plugins by category
   */
  static getByCategory(category: OutputPlugin['category']): OutputPlugin[] {
    return OutputPluginRegistry.getAll().filter(p => p.category === category);
  }

  /**
   * Get list of all registered plugin ids
   */
  static getIds(): string[] {
    return Array.from(OutputPluginRegistry.plugins.keys());
  }

  /**
   * Check if a plugin is registered
   */
  static has(id: string): boolean {
    return OutputPluginRegistry.plugins.has(id);
  }

  /**
   * Get the OutputType union type string for TypeScript compatibility
   */
  static getTypeString(): string {
    const ids = OutputPluginRegistry.getIds();
    return ids.map(id => `"${id}"`).join(' | ');
  }

  /**
   * Initialize all built-in plugins (called once)
   */
  static initialize(): void {
    if (OutputPluginRegistry.initialized) return;
    OutputPluginRegistry.initialized = true;
    registerBuiltinPlugins();
  }

  /**
   * Enable a plugin by id
   */
  static enable(id: string): boolean {
    const plugin = OutputPluginRegistry.plugins.get(id);
    if (!plugin) return false;
    plugin.enabled = true;
    return true;
  }

  /**
   * Disable a plugin by id
   */
  static disable(id: string): boolean {
    const plugin = OutputPluginRegistry.plugins.get(id);
    if (!plugin) return false;
    plugin.enabled = false;
    return true;
  }

  /**
   * Toggle plugin enabled state
   */
  static toggle(id: string): { enabled: boolean } | null {
    const plugin = OutputPluginRegistry.plugins.get(id);
    if (!plugin) return null;
    plugin.enabled = !plugin.enabled;
    return { enabled: plugin.enabled };
  }

  /**
   * Get a summary of all plugins for the API / UI
   */
  static getPluginSummaries(): Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
    category: string;
    enabled: boolean;
  }> {
    return OutputPluginRegistry.getAll().map(p => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      description: p.description,
      color: p.color,
      category: p.category,
      enabled: p.enabled,
    }));
  }
}

// ==================== BUILT-IN PLUGIN TRANSFORMS ====================

function generateHashtags(source: string): string[] {
  const words = source.split(/\s+/).filter(w => w.length > 4);
  const wordFreq: Record<string, number> = {};
  words.forEach(w => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length > 4) {
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    }
  });
  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([word]) => `#${word.charAt(0).toUpperCase() + word.slice(1)}`);
}

function transformVideo(source: string, config: TransformationConfig): TransformationResult {
  const sentences = source.split(/[.!?]+/).filter(s => s.trim());
  const scenes = sentences.map((sentence, i) => ({
    sceneNumber: i + 1,
    description: sentence.trim(),
    duration: `${Math.max(5, Math.min(30, sentence.trim().length / 5))}s`,
    visual: `Scene ${i + 1}: ${sentence.trim().substring(0, 60)}...`,
    narration: sentence.trim(),
  }));

  return {
    type: 'video' as TransformationResult['type'],
    title: `Video Package: ${source.substring(0, 80)}...`,
    content: JSON.stringify({
      script: {
        title: `Generated Video Script - ${new Date().toISOString().split('T')[0]}`,
        totalDuration: `${scenes.length * 10}s`,
        targetAudience: config.targetAudience,
        tone: config.tone,
        scenes,
      },
      storyboard: scenes.map(s => ({
        frame: s.sceneNumber,
        visual: s.visual,
        narration: s.narration,
        transition: s.sceneNumber < scenes.length ? 'fade' : 'end',
      })),
      subtitles: scenes.map(s => ({
        timecode: `${String(Math.floor((s.sceneNumber - 1) * 10 / 60)).padStart(2, '0')}:${String(((s.sceneNumber - 1) * 10) % 60).padStart(2, '0')}`,
        text: s.narration,
      })),
      visualRecommendations: [
        'Use professional color palette aligned with brand guidelines',
        'Include data visualizations for statistical content',
        'Add kinetic typography for key statistics',
        'Use smooth transitions between scenes',
        'Recommended aspect ratio: 16:9 for web, 9:16 for mobile',
      ],
      narrationText: scenes.map(s => s.narration).join('\n\n'),
    }, null, 2),
    metadata: {
      sceneCount: scenes.length,
      estimatedDuration: `${scenes.length * 10}s`,
      format: 'MP4 recommended',
      resolution: '1920x1080',
    },
  };
}

function transformLinkedIn(source: string, config: TransformationConfig): TransformationResult {
  const keyPoints = source.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 5);
  const hashtags = generateHashtags(source);

  const post = `🎯 ${keyPoints[0]?.trim() || 'Key insight'}

${keyPoints.slice(1).map(p => `📌 ${p.trim()}`).join('\n\n')}

${config.communicationObjective ? `💡 ${config.communicationObjective}` : ''}

${config.targetAudience ? `Who needs to know this? ${config.targetAudience}` : ''}

${hashtags}

#ThoughtLeadership #Innovation #${config.contentStyle || 'Professional'}`;

  return {
    type: 'linkedin' as TransformationResult['type'],
    title: `LinkedIn Post: ${source.substring(0, 60)}...`,
    content: post,
    metadata: {
      characterCount: post.length,
      hashtags,
      estimatedReach: 'Medium-High',
      bestPostingTime: 'Tuesday-Thursday, 8-10 AM',
      tone: config.tone,
      targetAudience: config.targetAudience,
    },
  };
}

function transformTwitter(source: string, config: TransformationConfig): TransformationResult {
  const sentences = source.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const threads = sentences.slice(0, 8).map((s, i) => ({
    tweetNumber: i + 1,
    content: `${i === 0 ? '🧵 Thread: ' : `${i}/`} ${s.trim()}${config.tone === 'urgent' ? ' ⚠️' : ''}`,
    charCount: s.trim().length + (i === 0 ? 10 : 4),
  }));

  const mainTweet = threads[0]?.content || source.substring(0, 280);

  return {
    type: 'twitter' as TransformationResult['type'],
    title: `Twitter/X Thread: ${source.substring(0, 60)}...`,
    content: JSON.stringify({
      mainTweet,
      thread: threads,
      hashtags: generateHashtags(source).slice(0, 5),
      engagementTips: [
        'Post thread during peak hours (9 AM - 12 PM EST)',
        'Reply to your own thread immediately',
        'Pin the first tweet to your profile',
        'Engage with early replies to boost algorithm',
      ],
    }, null, 2),
    metadata: {
      tweetCount: threads.length,
      totalCharacters: threads.reduce((sum, t) => sum + t.charCount, 0),
      isThread: threads.length > 1,
      platform: 'Twitter/X',
    },
  };
}

function transformAdvisory(source: string, config: TransformationConfig): TransformationResult {
  const sections = source.split(/\n\n+/);
  const keyFindings = source.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 5);

  const advisory = `
═══════════════════════════════════════════════════════════
                    SECURITY ADVISORY
                    ${new Date().toISOString().split('T')[0]}
═══════════════════════════════════════════════════════════

1. EXECUTIVE SUMMARY
─────────────────────
${sections[0]?.trim() || source.substring(0, 200)}

2. KEY FINDINGS
─────────────────────
${keyFindings.map((f, i) => `  ${i + 1}. ${f.trim()}`).join('\n')}

3. IMPACT ASSESSMENT
─────────────────────
  Severity Level: ${config.tone === 'urgent' ? 'CRITICAL' : 'MEDIUM-HIGH'}
  Target Systems: ${config.targetAudience || 'General infrastructure'}
  Risk Level: Elevated

4. RECOMMENDED ACTIONS
─────────────────────
  ✓ Implement immediate monitoring on affected systems
  ✓ Review and update access controls
  ✓ Conduct vulnerability assessment
  ✓ Notify relevant stakeholders
  ✓ Document incident response actions

5. TIMELINE
─────────────────────
  Report Generated: ${new Date().toISOString()}
  Classification: ${config.detailLevel === 'detailed' ? 'RESTRICTED' : 'CONFIDENTIAL'}
  Next Review: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}

═══════════════════════════════════════════════════════════
                    END OF ADVISORY
═══════════════════════════════════════════════════════════
`.trim();

  return {
    type: 'advisory' as TransformationResult['type'],
    title: `Security Advisory: ${source.substring(0, 60)}`,
    content: advisory,
    metadata: {
      classification: config.detailLevel === 'detailed' ? 'RESTRICTED' : 'CONFIDENTIAL',
      severity: config.tone === 'urgent' ? 'CRITICAL' : 'MEDIUM-HIGH',
      sections: ['Executive Summary', 'Key Findings', 'Impact Assessment', 'Recommended Actions', 'Timeline'],
      format: 'Structured Advisory Document',
    },
  };
}

function transformInfographic(source: string, config: TransformationConfig): TransformationResult {
  const stats = source.match(/\d+[%$KMB+]*/g) || [];
  const keyPoints = source.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 7);

  const infographic = {
    title: `Infographic: ${source.substring(0, 60)}...`,
    layout: {
      type: 'Vertical Scroll',
      dimensions: '1080 x 1920px (Instagram) or 1080 x 1350px (LinkedIn)',
      colorScheme: {
        primary: '#1a1a2e',
        secondary: '#16213e',
        accent: '#e94560',
        text: '#ffffff',
        background: '#0f3460',
      },
    },
    sections: keyPoints.map((point, i) => ({
      sectionNumber: i + 1,
      headline: `Key Point ${i + 1}`,
      content: point.trim(),
      icon: ['📊', '🔍', '⚡', '🛡️', '📈', '🎯', '💡'][i % 7],
      dataPoint: stats[i] || null,
    })),
    keyMessaging: {
      mainMessage: keyPoints[0]?.trim() || source.substring(0, 100),
      supportingPoints: keyPoints.slice(1, 4).map(p => p.trim()),
      callToAction: config.communicationObjective || 'Learn More',
    },
    designRecommendations: [
      'Use bold, contrasting colors for data points',
      'Include icons for each section',
      'Add progress bars or charts for statistics',
      'Use hierarchy with font sizes (Title: 48pt, Headline: 36pt, Body: 24pt)',
      'Include source attribution at the bottom',
      'Add QR code linking to full report',
    ],
  };

  return {
    type: 'infographic' as TransformationResult['type'],
    title: infographic.title,
    content: JSON.stringify(infographic, null, 2),
    metadata: {
      dimensions: infographic.layout.dimensions,
      sections: infographic.sections.length,
      dataPoints: stats.length,
      format: 'PNG/SVG recommended',
    },
  };
}

function transformExecutiveSummary(source: string, config: TransformationConfig): TransformationResult {
  const sentences = source.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const keyFindings = sentences.slice(0, 3).map(s => s.trim());
  const recommendations = sentences.slice(3, 6).map(s => s.trim());

  const summary = `
┌─────────────────────────────────────────────────────────┐
│              EXECUTIVE SUMMARY                           │
│              ${new Date().toISOString().split('T')[0]}                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  OVERVIEW                                                │
│  ────────                                                │
│  ${keyFindings[0] || source.substring(0, 150)}
│                                                          │
│  KEY FINDINGS                                            │
│  ────────────                                            │
${keyFindings.map((f, i) => `│  ${i + 1}. ${f.substring(0, 60)}`).join('\n')}
│                                                          │
│  RECOMMENDATIONS                                         │
│  ───────────────                                         │
${recommendations.map((r, i) => `│  ✓ ${r.substring(0, 60)}`).join('\n')}
│                                                          │
│  IMPACT ANALYSIS                                         │
│  ───────────────                                         │
│  Target Audience: ${(config.targetAudience || 'Decision Makers').substring(0, 40)}
│  Urgency Level: ${config.tone === 'urgent' ? 'HIGH' : 'MEDIUM'}
│  Communication Style: ${config.tone}
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Classification: ${config.detailLevel === 'detailed' ? 'CONFIDENTIAL' : 'INTERNAL'}
│  Generated: ${new Date().toISOString()}
│  Operator: Content Transformation Platform
└─────────────────────────────────────────────────────────┘
`.trim();

  return {
    type: 'executive_summary' as TransformationResult['type'],
    title: `Executive Summary: ${source.substring(0, 60)}`,
    content: summary,
    metadata: {
      wordCount: summary.split(/\s+/).length,
      readingTime: `${Math.ceil(summary.split(/\s+/).length / 200)} min`,
      keyFindingsCount: keyFindings.length,
      recommendationsCount: recommendations.length,
      format: 'Executive Briefing',
    },
  };
}

function transformPresentation(source: string, config: TransformationConfig): TransformationResult {
  const keyPoints = source.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 10);

  const slides = [
    {
      slideNumber: 1,
      title: 'Title Slide',
      layout: 'Title',
      content: source.substring(0, 60),
      notes: 'Welcome and introduce the topic. Set the stage for the presentation.',
      visual: 'Organization logo, date, presenter name',
    },
    ...keyPoints.map((point, i) => ({
      slideNumber: i + 2,
      title: `Key Point ${i + 1}`,
      layout: i % 3 === 0 ? 'Content with Image' : 'Two Content',
      content: point.trim(),
      notes: `Elaborate on: ${point.trim()}. Provide context and examples.`,
      visual: i % 2 === 0 ? 'Data visualization' : 'Supporting graphic',
    })),
    {
      slideNumber: keyPoints.length + 2,
      title: 'Summary & Next Steps',
      layout: 'Conclusion',
      content: `Key Takeaways:\n${keyPoints.slice(0, 3).map((p, i) => `${i + 1}. ${p.trim()}`).join('\n')}`,
      notes: 'Summarize main points. Open floor for questions. Outline next steps.',
      visual: 'Action items checklist',
    },
  ];

  return {
    type: 'presentation' as TransformationResult['type'],
    title: `Presentation: ${source.substring(0, 60)}...`,
    content: JSON.stringify({
      slideDeck: {
        title: source.substring(0, 60),
        totalSlides: slides.length,
        estimatedDuration: `${slides.length * 2} minutes`,
        targetAudience: config.targetAudience,
        theme: 'Professional Dark',
        slides,
      },
      speakerNotes: slides.map(s => ({ slide: s.slideNumber, notes: s.notes })),
      designGuide: {
        fontFamily: 'Calibri / Arial',
        primaryColor: '#1a1a2e',
        accentColor: '#e94560',
        slideLayouts: ['Title', 'Content', 'Two Content', 'Content with Image', 'Conclusion'],
        recommendations: [
          'Use maximum 6 lines per slide',
          'Include visuals on every slide',
          'Use consistent color scheme',
          'Add slide numbers',
          'Include source citations',
        ],
      },
    }, null, 2),
    metadata: {
      slideCount: slides.length,
      estimatedDuration: `${slides.length * 2} min`,
      format: 'PowerPoint (PPTX) or Google Slides',
      aspectRatio: '16:9',
    },
  };
}

function transformCrisisResponse(source: string, config: TransformationConfig): TransformationResult {
  const sentences = source.split(/[.!?]+/).filter(s => s.trim().length > 10);

  const crisisResponse = {
    template: 'Crisis Communication Plan',
    severity: config.tone === 'urgent' ? 'CRITICAL' : 'HIGH',
    sections: {
      situationOverview: sentences[0]?.trim() || 'Situation under assessment',
      impactStatement: sentences[1]?.trim() || 'Impact being evaluated',
      immediateActions: sentences.slice(2, 5).map(s => s.trim()),
      stakeholderNotifications: [
        { audience: 'Internal Teams', channel: 'Email + Slack', priority: 'IMMEDIATE' },
        { audience: 'Customers', channel: 'Email + Status Page', priority: 'WITHIN 1 HOUR' },
        { audience: 'Media', channel: 'Press Release', priority: 'WITHIN 4 HOURS' },
        { audience: 'Regulators', channel: 'Formal Notification', priority: 'AS REQUIRED' },
      ],
      mediaTalkingPoints: [
        'We are aware of the situation and are taking immediate action',
        'The safety and security of our stakeholders is our top priority',
        'We will provide regular updates as the situation develops',
      ],
      escalationMatrix: [
        { level: 1, responder: 'Incident Commander', timeframe: 'Immediate' },
        { level: 2, responder: 'Security Team Lead', timeframe: '15 minutes' },
        { level: 3, responder: 'Executive Leadership', timeframe: '30 minutes' },
        { level: 4, responder: 'Legal & Compliance', timeframe: '1 hour' },
      ],
      timeline: {
        detection: new Date().toISOString(),
        notification: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        resolution: 'Pending assessment',
      },
    },
    templates: {
      emailTemplate: `Subject: Important Security Update\n\nDear [Stakeholder],\n\nWe want to inform you of [situation]. We are actively working to [response].\n\nWhat happened: [summary]\nWhat we're doing: [actions]\nWhat you should do: [instructions]\n\nWe will provide updates at [frequency].\n\nContact: [security team email]`,
      socialMediaTemplate: `We're aware of [situation] and are actively addressing it. Our team is working to resolve this. Updates: [status page URL]`,
      pressReleaseTemplate: `FOR IMMEDIATE RELEASE\n\n[Organization] Addresses [Situation]\n\n[City, Date] - [Organization] today announced [response to situation].`,
    },
  };

  return {
    type: 'crisis_response' as TransformationResult['type'],
    title: `Crisis Response Plan: ${source.substring(0, 60)}`,
    content: JSON.stringify(crisisResponse, null, 2),
    metadata: {
      severity: crisisResponse.severity,
      stakeholderGroups: crisisResponse.sections.stakeholderNotifications.length,
      escalationLevels: crisisResponse.sections.escalationMatrix.length,
      templatesIncluded: 3,
      format: 'Crisis Communication Package',
    },
  };
}

// ==================== REGISTER BUILT-IN PLUGINS ====================

function registerBuiltinPlugins(): void {
  const builtins: OutputPlugin[] = [
    {
      id: 'video',
      name: 'Video Package',
      icon: '🎬',
      description: 'Script, storyboard, scene descriptions, narration, subtitles',
      color: '#ef4444',
      category: 'media',
      enabled: true,
      transform: transformVideo,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Post',
      icon: '💼',
      description: 'Professional post with hashtags and engagement tips',
      color: '#3b82f6',
      category: 'social',
      enabled: true,
      transform: transformLinkedIn,
    },
    {
      id: 'twitter',
      name: 'Twitter/X Post',
      icon: '🐦',
      description: 'Platform-optimized tweets and thread',
      color: '#06b6d4',
      category: 'social',
      enabled: true,
      transform: transformTwitter,
    },
    {
      id: 'advisory',
      name: 'Advisory',
      icon: '📋',
      description: 'Structured security advisory document',
      color: '#f59e0b',
      category: 'document',
      enabled: true,
      approvalConfig: { requiredApprovals: 3, deadlineHours: 48, roles: ['ANALYST', 'REVIEWER', 'SENIOR'] },
      transform: transformAdvisory,
    },
    {
      id: 'infographic',
      name: 'Infographic',
      icon: '📊',
      description: 'Layout recommendations and key messaging',
      color: '#10b981',
      category: 'media',
      enabled: true,
      transform: transformInfographic,
    },
    {
      id: 'executive_summary',
      name: 'Executive Summary',
      icon: '👔',
      description: 'Concise executive briefing',
      color: '#8b5cf6',
      category: 'document',
      enabled: true,
      approvalConfig: { requiredApprovals: 2, deadlineHours: 72, roles: ['REVIEWER', 'SENIOR'] },
      transform: transformExecutiveSummary,
    },
    {
      id: 'presentation',
      name: 'Presentation',
      icon: '📽️',
      description: 'Slides with speaker notes',
      color: '#ec4899',
      category: 'document',
      enabled: true,
      transform: transformPresentation,
    },
    {
      id: 'crisis_response',
      name: 'Crisis Response',
      icon: '🚨',
      description: 'Crisis communication workflow',
      color: '#ef4444',
      category: 'crisis',
      enabled: true,
      approvalConfig: { requiredApprovals: 3, deadlineHours: 24, roles: ['ANALYST', 'REVIEWER', 'SENIOR', 'EXECUTIVE'] },
      transform: transformCrisisResponse,
    },
  ];

  for (const plugin of builtins) {
    OutputPluginRegistry.register(plugin);
  }
}

// Auto-initialize on import
OutputPluginRegistry.initialize();
