/**
 * Context Engine
 * 
 * Extracts structured context from source content.
 * Ensures consistency across all generated outputs by providing
 * a shared understanding of the source material.
 * 
 * Works with OpenAI API when available, falls back to intelligent
 * rule-based extraction for demos.
 */

export interface StructuredContext {
  topic: string;
  summary: string;
  facts: string[];
  entities: Array<{ name: string; type: string; role?: string }>;
  risks: Array<{ title: string; severity: string; description: string }>;
  keyMetrics: Array<{ label: string; value: string; unit?: string }>;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' | 'urgent';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  targetAudiences: string[];
  recommendedOutputs: string[];
  language: string;
  confidence: number;
}

// ==================== CONTEXT EXTRACTION ====================

/**
 * Extract structured context from source content
 */
export async function extractContext(
  sourceContent: string,
  options?: { targetAudience?: string; tone?: string }
): Promise<StructuredContext> {
  // Try OpenAI first, fall back to rule-based
  if (process.env.OPENAI_API_KEY) {
    try {
      return await extractWithAI(sourceContent, options);
    } catch (e) {
      console.warn('AI extraction failed, falling back to rule-based:', e);
    }
  }
  return extractWithRules(sourceContent, options);
}

/**
 * AI-powered extraction using OpenAI
 */
async function extractWithAI(
  sourceContent: string,
  options?: { targetAudience?: string; tone?: string }
): Promise<StructuredContext> {
  const prompt = `Analyze the following content and extract structured context. Return ONLY valid JSON.

Source Content:
${sourceContent.substring(0, 4000)}

Extract:
- topic: Main topic (1 line)
- summary: 2-3 sentence summary
- facts: Array of key facts (5-10)
- entities: Array of {name, type, role} for people/orgs/products mentioned
- risks: Array of {title, severity: LOW|MEDIUM|HIGH|CRITICAL, description}
- keyMetrics: Array of {label, value, unit} for any numbers/statistics
- sentiment: positive|negative|neutral|mixed|urgent
- urgency: low|medium|high|critical
- category: threat-intel|advisory|policy|incident|research|general
- recommendedOutputs: best output formats for this content
- confidence: 0-100

Return JSON matching this exact structure.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from AI');

  const parsed = JSON.parse(content);
  return normalizeContext(parsed, sourceContent);
}

/**
 * Rule-based extraction (no API key needed)
 */
function extractWithRules(
  sourceContent: string,
  options?: { targetAudience?: string; tone?: string }
): StructuredContext {
  const text = sourceContent.toLowerCase();
  const sentences = sourceContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const words = sourceContent.split(/\s+/).filter(Boolean);

  // Extract topic (first meaningful sentence or line)
  const lines = sourceContent.split('\n').filter(l => l.trim().length > 5);
  const topic = lines[0]?.trim().substring(0, 120) || sentences[0]?.trim().substring(0, 120) || 'Untitled Content';

  // Extract summary (first 2-3 sentences)
  const summary = sentences.slice(0, 3).join('. ').trim() + '.';

  // Extract facts (sentences with numbers, percentages, or key terms)
  const facts = sentences
    .filter(s => /\d+[%$KMB]|\b(critical|high|medium|low|risk|threat|vulnerability|attack|breach|incident|impact|affected|recommend|must|should)\b/i.test(s))
    .slice(0, 8)
    .map(s => s.trim());

  // If not enough facts, use first few sentences
  if (facts.length < 3) {
    facts.push(...sentences.slice(0, 5).map(s => s.trim()));
  }

  // Extract entities (capitalized words, proper nouns)
  const entityPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  const entityMatches = sourceContent.match(entityPattern) || [];
  const entityFreq: Record<string, number> = {};
  entityMatches.forEach(e => { entityFreq[e] = (entityFreq[e] || 0) + 1; });
  const entities = Object.entries(entityFreq)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({
      name,
      type: detectEntityType(name, sourceContent),
      role: count > 3 ? 'primary' : 'mentioned',
    }));

  // Extract risks
  const risks: StructuredContext['risks'] = [];
  const riskPatterns = [
    { pattern: /\b(critical|severe)\b.*\b(risk|threat|vulnerability|impact)\b/i, severity: 'CRITICAL' },
    { pattern: /\b(high|significant)\b.*\b(risk|threat|vulnerability|impact)\b/i, severity: 'HIGH' },
    { pattern: /\b(medium|moderate)\b.*\b(risk|threat|vulnerability|impact)\b/i, severity: 'MEDIUM' },
    { pattern: /\b(low|minor)\b.*\b(risk|threat|vulnerability|impact)\b/i, severity: 'LOW' },
    { pattern: /\b(ransomware|malware|phishing|data.?breach|zero.?day|exploit|attack)\b/i, severity: 'HIGH' },
    { pattern: /\b(unauthorized|compromised|exposed|leaked|stolen)\b/i, severity: 'MEDIUM' },
  ];

  for (const { pattern, severity } of riskPatterns) {
    const match = sourceContent.match(pattern);
    if (match) {
      const contextStart = Math.max(0, match.index! - 40);
      const contextEnd = Math.min(sourceContent.length, match.index! + match[0].length + 40);
      risks.push({
        title: match[0],
        severity,
        description: sourceContent.substring(contextStart, contextEnd).trim(),
      });
    }
  }

  // Extract key metrics
  const keyMetrics: StructuredContext['keyMetrics'] = [];
  const metricPatterns = [
    { pattern: /(\d+(?:\.\d+)?)\s*%/g, label: 'Percentage', unit: '%' },
    { pattern: /(\d+(?:\.\d+)?)\s*(?:million|million|billion|trillion)\b/gi, label: 'Count', unit: 'scale' },
    { pattern: /\$\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:million|billion)?/g, label: 'Financial', unit: 'USD' },
    { pattern: /(\d+(?:\.\d+)?)\s*(?:GB|TB|MB|PB)\b/gi, label: 'Data Size', unit: 'bytes' },
    { pattern: /(\d+)\s*(?:hours?|days?|weeks?|months?)\b/gi, label: 'Duration', unit: 'time' },
  ];

  for (const { pattern, label, unit } of metricPatterns) {
    let match;
    while ((match = pattern.exec(sourceContent)) !== null) {
      keyMetrics.push({ label, value: match[1], unit });
      if (keyMetrics.length >= 6) break;
    }
    if (keyMetrics.length >= 6) break;
  }

  // Detect sentiment
  const urgentWords = /\b(urgent|emergency|critical|immediate|now|asap|alert|warning)\b/gi;
  const negativeWords = /\b(attack|breach|incident|risk|threat|vulnerability|compromised|stolen|leaked)\b/gi;
  const positiveWords = /\b(success|improved|enhanced|resolved|protected|secure|safe)\b/gi;

  const urgentCount = (sourceContent.match(urgentWords) || []).length;
  const negativeCount = (sourceContent.match(negativeWords) || []).length;
  const positiveCount = (sourceContent.match(positiveWords) || []).length;

  let sentiment: StructuredContext['sentiment'] = 'neutral';
  if (urgentCount > 2) sentiment = 'urgent';
  else if (negativeCount > positiveCount + 2) sentiment = 'negative';
  else if (positiveCount > negativeCount + 2) sentiment = 'positive';
  else if (negativeCount > 0 && positiveCount > 0) sentiment = 'mixed';

  // Detect urgency
  let urgency: StructuredContext['urgency'] = 'low';
  if (urgentCount > 3 || /\b(critical|emergency|immediate)\b/i.test(sourceContent)) urgency = 'critical';
  else if (urgentCount > 1 || /\b(urgent|asap|deadline)\b/i.test(sourceContent)) urgency = 'high';
  else if (urgentCount > 0 || /\b(important|attention|review)\b/i.test(sourceContent)) urgency = 'medium';

  // Detect category
  let category = 'general';
  if (/\b(ransomware|malware|phishing|breach|attack|exploit|vulnerability|CVE|threat)\b/i.test(sourceContent)) category = 'threat-intel';
  else if (/\b(advisory|recommend|guideline|best.?practice)\b/i.test(sourceContent)) category = 'advisory';
  else if (/\b(policy|compliance|regulation|dpdp|gdpr|it.?act)\b/i.test(sourceContent)) category = 'policy';
  else if (/\b(incident|outage|disruption|affected|response)\b/i.test(sourceContent)) category = 'incident';
  else if (/\b(research|study|analysis|report|findings)\b/i.test(sourceContent)) category = 'research';

  // Recommend outputs based on category and urgency
  const recommendedOutputs = ['executive_summary', 'advisory'];
  if (urgency === 'critical' || urgency === 'high') {
    recommendedOutputs.push('crisis_response', 'linkedin', 'twitter');
  } else {
    recommendedOutputs.push('linkedin', 'presentation');
  }
  if (category === 'threat-intel') recommendedOutputs.push('advisory');
  if (words.length > 300) recommendedOutputs.push('video');

  // Determine target audiences
  const targetAudiences = ['executives', 'employees'];
  if (category === 'threat-intel') targetAudiences.push('technical');
  if (urgency === 'critical') targetAudiences.push('public');

  return normalizeContext({
    topic,
    summary,
    facts: facts.length > 0 ? facts : ['Content analysis complete'],
    entities,
    risks: risks.length > 0 ? risks : [{ title: 'Standard Review Required', severity: 'LOW', description: 'Routine content review recommended' }],
    keyMetrics,
    sentiment,
    urgency,
    category,
    targetAudiences,
    recommendedOutputs: [...new Set(recommendedOutputs)].slice(0, 5),
    language: options?.tone || 'professional',
    confidence: Math.min(95, 60 + facts.length * 5 + entities.length * 3),
  }, sourceContent);
}

// ==================== HELPERS ====================

function detectEntityType(name: string, context: string): string {
  const ctx = context.toLowerCase();
  if (/\b(ceo|cto|ciso|director|president|minister|officer|secretary)\b/i.test(ctx) && ctx.includes(name.toLowerCase())) return 'person';
  if (/\b(corp|inc|ltd|llc|org|foundation|institute|university)\b/i.test(name)) return 'organization';
  if (/\b(cve-\d+|v\d+\.\d+|version)\b/i.test(name)) return 'technology';
  if (/\b(usa|india|uk|china|russia)\b/i.test(name)) return 'location';
  return 'entity';
}

function normalizeContext(raw: Record<string, any>, sourceContent: string): StructuredContext {
  return {
    topic: String(raw.topic || 'Untitled').substring(0, 200),
    summary: String(raw.summary || sourceContent.substring(0, 300)),
    facts: Array.isArray(raw.facts) ? raw.facts.map(String).slice(0, 10) : ['Content analyzed'],
    entities: Array.isArray(raw.entities) ? raw.entities.map((e: any) => ({
      name: String(e?.name || ''),
      type: String(e?.type || 'entity'),
      role: e?.role ? String(e.role) : undefined,
    })).filter(e => e.name) : [],
    risks: Array.isArray(raw.risks) ? raw.risks.map((r: any) => ({
      title: String(r?.title || 'Unknown Risk'),
      severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(r?.severity) ? r.severity : 'MEDIUM',
      description: String(r?.description || ''),
    })) : [],
    keyMetrics: Array.isArray(raw.keyMetrics) ? raw.keyMetrics.map((m: any) => ({
      label: String(m?.label || ''),
      value: String(m?.value || ''),
      unit: m?.unit ? String(m.unit) : undefined,
    })) : [],
    sentiment: ['positive', 'negative', 'neutral', 'mixed', 'urgent'].includes(raw.sentiment) ? raw.sentiment : 'neutral',
    urgency: ['low', 'medium', 'high', 'critical'].includes(raw.urgency) ? raw.urgency : 'low',
    category: String(raw.category || 'general'),
    targetAudiences: Array.isArray(raw.targetAudiences) ? raw.targetAudiences.map(String) : ['general'],
    recommendedOutputs: Array.isArray(raw.recommendedOutputs) ? raw.recommendedOutputs.map(String) : ['executive_summary', 'advisory'],
    language: String(raw.language || 'professional'),
    confidence: typeof raw.confidence === 'number' ? Math.min(100, Math.max(0, raw.confidence)) : 75,
  };
}
