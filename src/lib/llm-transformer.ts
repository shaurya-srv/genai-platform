/**
 * LLM-Powered Content Transformer
 * 
 * Uses OpenAI GPT to transform source content into different formats.
 * Falls back to sophisticated template-based transformation when no API key.
 * 
 * Environment variables:
 *   OPENAI_API_KEY=sk-...
 *   OPENAI_MODEL=gpt-4o (default)
 */

import OpenAI from 'openai';

let openai: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (openai) return openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  openai = new OpenAI({ apiKey: key });
  return openai;
}

// ==================== TYPES ====================

export interface TransformRequest {
  sourceContent: string;
  outputType: string;
  config: {
    targetAudience: string;
    tone: string;
    language: string;
    detailLevel: string;
    communicationObjective: string;
  };
}

export interface TransformResponse {
  content: string;
  model: 'llm' | 'template';
  tokensUsed?: number;
}

// ==================== OUTPUT TYPE PROMPTS ====================

const OUTPUT_PROMPTS: Record<string, { system: string; user: string }> = {
  linkedin: {
    system: `You are a professional social media content creator specializing in LinkedIn. Transform the given content into an engaging LinkedIn post. Use professional language, relevant hashtags, and a compelling hook. Keep it under 1300 characters. Include 3-5 relevant hashtags at the end.`,
    user: `Transform this content into a LinkedIn post for {audience} audience. Tone: {tone}. Language: {language}.\n\nContent:\n{content}`,
  },
  twitter: {
    system: `You are a Twitter/X content specialist. Transform the given content into a tweet thread (max 8 tweets). First tweet should be a hook. Use concise language, relevant hashtags. Each tweet under 280 characters.`,
    user: `Transform this content into a Twitter thread for {audience} audience. Tone: {tone}.\n\nContent:\n{content}`,
  },
  advisory: {
    system: `You are a government security analyst. Transform the given content into a formal security advisory document. Use structured sections: Executive Summary, Key Findings, Impact Assessment, Recommended Actions, Timeline. Use formal, authoritative language appropriate for government communications.`,
    user: `Transform this content into a formal security advisory. Detail level: {detail}. Tone: {tone}.\n\nContent:\n{content}`,
  },
  executive_summary: {
    system: `You are an executive communications specialist. Transform the given content into a concise executive summary. Use bullet points, key metrics, and action items. Keep it under 500 words. Tone should be {tone} and suitable for {audience}.`,
    user: `Create an executive summary from this content. Objective: {objective}.\n\nContent:\n{content}`,
  },
  presentation: {
    system: `You are a presentation designer. Transform the given content into a structured slide deck. For each slide, provide: title, 3-5 bullet points, and speaker notes. Create 6-10 slides. Use clear, visual language. First slide is always a title slide.`,
    user: `Transform this content into a presentation deck for {audience}. Tone: {tone}. Detail: {detail}.\n\nContent:\n{content}`,
  },
  infographic: {
    system: `You are a data visualization specialist. Transform the given content into infographic data points. Extract key statistics, create section breakdowns with icons, and suggest visual layouts. Format as structured JSON with sections, stats, and design recommendations.`,
    user: `Extract infographic data from this content. Audience: {audience}.\n\nContent:\n{content}`,
  },
  video: {
    system: `You are a video script writer. Transform the given content into a video script with 4-6 scenes. Each scene needs: visual description, narration text (spoken aloud), duration, and transition. Write engaging, broadcast-quality narration.`,
    user: `Transform this content into a video script. Tone: {tone}. Duration: 2-3 minutes total.\n\nContent:\n{content}`,
  },
  crisis_response: {
    system: `You are a crisis communications expert. Transform the given content into a comprehensive crisis response plan. Include: situation overview, impact statement, immediate actions, stakeholder notifications, media talking points, escalation matrix, and templates for email/social/press.`,
    user: `Create a crisis response plan from this content. Severity: {detail}. Tone: urgent and authoritative.\n\nContent:\n{content}`,
  },
};

// ==================== LLM TRANSFORM ====================

async function llmTransform(request: TransformRequest): Promise<TransformResponse> {
  const client = getClient();
  if (!client) return templateTransform(request);

  const prompt = OUTPUT_PROMPTS[request.outputType] || OUTPUT_PROMPTS.linkedin;
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const userMessage = prompt.user
    .replace('{content}', request.sourceContent.substring(0, 4000))
    .replace('{audience}', request.config.targetAudience)
    .replace('{tone}', request.config.tone)
    .replace('{language}', request.config.language)
    .replace('{detail}', request.config.detailLevel)
    .replace('{objective}', request.config.communicationObjective);

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;

    return { content, model: 'llm', tokensUsed };
  } catch (e) {
    console.error('[LLM] API error, falling back to template:', e);
    return templateTransform(request);
  }
}

// ==================== TEMPLATE FALLBACK ====================

function templateTransform(request: TransformRequest): TransformResponse {
  const { sourceContent, outputType, config } = request;
  const sentences = sourceContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const firstSentence = sentences[0]?.trim() || sourceContent.substring(0, 100);

  let content = '';

  switch (outputType) {
    case 'linkedin':
      content = `🎯 ${firstSentence}\n\n${sentences.slice(1, 4).map(s => `📌 ${s.trim()}`).join('\n\n')}\n\n💡 ${config.communicationObjective}\n\n#ThoughtLeadership #Innovation #Professional`;
      break;

    case 'twitter':
      content = sentences.slice(0, 4).map((s, i) => `${i === 0 ? '🧵 Thread: ' : `${i}/`} ${s.trim()}`).join('\n\n');
      break;

    case 'advisory':
      content = `═══════════════════════════════════════\n           SECURITY ADVISORY\n           ${new Date().toISOString().split('T')[0]}\n═══════════════════════════════════════\n\n1. EXECUTIVE SUMMARY\n${firstSentence}\n\n2. KEY FINDINGS\n${sentences.slice(0, 5).map((s, i) => `  ${i + 1}. ${s.trim()}`).join('\n')}\n\n3. RECOMMENDED ACTIONS\n  ✓ Implement immediate monitoring\n  ✓ Review access controls\n  ✓ Notify stakeholders\n\n═══════════════════════════════════════`;
      break;

    case 'executive_summary':
      content = `┌─────────────────────────────────────┐\n│        EXECUTIVE SUMMARY             │\n│        ${new Date().toISOString().split('T')[0]}              │\n├─────────────────────────────────────┤\n\nOVERVIEW\n${firstSentence}\n\nKEY FINDINGS\n${sentences.slice(0, 3).map((s, i) => `${i + 1}. ${s.trim().substring(0, 80)}`).join('\n')}\n\nRECOMMENDATIONS\n${sentences.slice(3, 6).map(s => `✓ ${s.trim().substring(0, 80)}`).join('\n')}\n\n└─────────────────────────────────────┘`;
      break;

    case 'crisis_response':
      content = JSON.stringify({
        template: 'Crisis Communication Plan',
        severity: config.tone === 'urgent' ? 'CRITICAL' : 'HIGH',
        sections: {
          situationOverview: firstSentence,
          immediateActions: sentences.slice(2, 5).map(s => s.trim()),
          escalationMatrix: [
            { level: 1, responder: 'Incident Commander', timeframe: 'Immediate' },
            { level: 2, responder: 'Security Team Lead', timeframe: '15 minutes' },
            { level: 3, responder: 'Executive Leadership', timeframe: '30 minutes' },
          ],
        },
      }, null, 2);
      break;

    default:
      content = sourceContent;
  }

  return { content, model: 'template' };
}

// ==================== BATCH TRANSFORM ====================

export async function batchTransform(
  sourceContent: string,
  outputTypes: string[],
  config: TransformRequest['config']
): Promise<Array<{ type: string; content: string; model: string; tokensUsed?: number }>> {
  const results = await Promise.all(
    outputTypes.map(async type => {
      const result = await llmTransform({ sourceContent, outputType: type, config });
      return { type, content: result.content, model: result.model, tokensUsed: result.tokensUsed };
    })
  );
  return results;
}

// ==================== EXPORT ====================

export { llmTransform, templateTransform };
export default llmTransform;
