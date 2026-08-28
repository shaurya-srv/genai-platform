/**
 * Content Transformation Engine
 * 
 * Uses the OutputPluginRegistry to delegate transformation to registered plugins.
 * New output types can be added by registering a plugin in output-plugins.ts —
 * no changes to this file needed.
 */

import { OutputPluginRegistry, OutputPlugin } from './output-plugins';

// Re-export the OutputType as a derived union from the registry
// This stays as a string union for TypeScript compatibility across the codebase
export type OutputType =
  | 'video'
  | 'linkedin'
  | 'twitter'
  | 'advisory'
  | 'infographic'
  | 'executive_summary'
  | 'presentation'
  | 'crisis_response';

export interface TransformationConfig {
  outputTypes: OutputType[];
  targetAudience: string;
  tone: 'formal' | 'casual' | 'technical' | 'urgent' | 'persuasive';
  language: string;
  detailLevel: 'brief' | 'standard' | 'detailed';
  communicationObjective: string;
  contentStyle: string;
}

export interface TransformationResult {
  type: OutputType;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface FullTransformationResponse {
  id: string;
  sourceHash: string;
  results: TransformationResult[];
  config: TransformationConfig;
  timestamp: number;
  consistencyScore: number;
}

/**
 * Main transformation engine — delegates to registered plugins
 */
export class ContentTransformer {
  /**
   * Transform source content into all selected output formats
   */
  static async transform(
    sourceContent: string,
    config: TransformationConfig
  ): Promise<FullTransformationResponse> {
    const results: TransformationResult[] = [];

    for (const outputType of config.outputTypes) {
      const result = await ContentTransformer.transformToType(sourceContent, outputType, config);
      results.push(result);
    }

    const consistencyScore = ContentTransformer.calculateConsistencyScore(results, sourceContent);

    return {
      id: crypto.randomUUID(),
      sourceHash: '',
      results,
      config,
      timestamp: Date.now(),
      consistencyScore,
    };
  }

  /**
   * Transform to a specific output type by looking up the registered plugin.
   * Falls back to a stub if the plugin is not found (shouldn't happen with builtins).
   */
  static async transformToType(
    sourceContent: string,
    outputType: OutputType,
    config: TransformationConfig
  ): Promise<TransformationResult> {
    const plugin = OutputPluginRegistry.get(outputType);

    if (plugin && typeof plugin.transform === 'function') {
      return plugin.transform(sourceContent, config);
    }

    // Fallback — should not be reached with built-in plugins
    return {
      type: outputType,
      title: `Output: ${outputType}`,
      content: sourceContent,
      metadata: { fallback: true, pluginNotFound: outputType },
    };
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Calculate consistency score across multiple outputs
   */
  static calculateConsistencyScore(results: TransformationResult[], source: string): number {
    if (results.length <= 1) return 100;

    const sourceWords = new Set(source.toLowerCase().split(/\s+/));
    let totalOverlap = 0;

    for (const result of results) {
      const resultWords = new Set(result.content.toLowerCase().split(/\s+/));
      const overlap = [...sourceWords].filter(w => resultWords.has(w)).length;
      totalOverlap += overlap / sourceWords.size;
    }

    const avgOverlap = totalOverlap / results.length;
    return Math.min(100, Math.round(avgOverlap * 100 + 20));
  }
}
