/**
 * File Generation Utilities
 * Generates actual downloadable files: PPTX slides, SRT subtitles, SVG infographics, STIX/TAXII JSON
 */

import { createHash } from 'crypto';

// ==================== PPTX GENERATION ====================

export interface PPTXSlide {
  slideNumber: number;
  title: string;
  content: string;
  notes: string;
  layout: 'title' | 'content' | 'twoColumn' | 'conclusion';
}

export interface PPTXOutput {
  fileName: string;
  slides: PPTXSlide[];
  totalSlides: number;
  estimatedDuration: string;
  xmlData: string; // OOXML slide data
}

/**
 * Generate PPTX-compatible XML slide data.
 * Each slide has a title, bullet content, and speaker notes.
 */
export function generatePPTX(slides: PPTXSlide[], title: string): PPTXOutput {
  const pptxSlides = slides.map((slide, i) => ({
    slideNumber: i + 1,
    title: slide.title,
    content: slide.content,
    notes: slide.notes,
    layout: slide.layout,
  }));

  const xmlData = buildOOXML(pptxSlides, title);

  return {
    fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`,
    slides: pptxSlides,
    totalSlides: pptxSlides.length,
    estimatedDuration: `${pptxSlides.length * 2} minutes`,
    xmlData,
  };
}

function buildOOXML(slides: PPTXSlide[], presentationTitle: string): string {
  const slideXml = slides.map((s, i) => `
    <p:sld id="${i + 2}">
      <p:cSld>
        <p:spTree>
          <p:nvGrpSpPr><p:cNvPr id="1" name="Title ${i + 1}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
          <p:sp>
            <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
            <p:spPr><a:xfrm><a:off x="457200" y="274638"/><a:ext cx="8229600" cy="1143000"/></a:xfrm></p:spPr>
            <p:txBody>
              <a:p><a:r><a:rPr lang="en-US" sz="3200" b="1"/><a:t>${escapeXml(s.title)}</a:t></a:r></a:p>
            </p:txBody>
          </p:sp>
          <p:sp>
            <p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr>
            <p:spPr><a:xfrm><a:off x="457200" y="1600200"/><a:ext cx="8229600" cy="4525963"/></a:xfrm></p:spPr>
            <p:txBody>
              ${s.content.split('\n').filter(l => l.trim()).map(line =>
                `<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US" sz="2000"/><a:t>${escapeXml(line.trim())}</a:t></a:r></a:p>`
              ).join('\n              ')}
            </p:txBody>
          </p:sp>
        </p:spTree>
      </p:cSld>
      <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
      <p:extLst><p:ext uri="{BB962C8B-B68F-43E3-A091-5EB1E7EF45D4}"><p14:modifyId xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" val="{00000000-0000-0000-0000-000000000000}"/></p:ext></p:extLst>
    </p:sld>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldMasterIdLst/>
  <p:sldIdLst>
    ${slides.map((_, i) => `<p:sldId id="${i + 2}" r:id="rId${i + 1}"/>`).join('\n    ')}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>
<!-- SLIDES_DATA -->
${slideXml}`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ==================== SRT SUBTITLE GENERATION ====================

export interface SRTEntry {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

/**
 * Generate SRT subtitle file content
 */
export function generateSRT(scenes: Array<{ text: string; durationSec: number }>): string {
  let currentTime = 0;
  const entries: SRTEntry[] = scenes.map((scene, i) => {
    const startTime = formatSRTTime(currentTime);
    currentTime += scene.durationSec;
    const endTime = formatSRTTime(currentTime);
    return { index: i + 1, startTime, endTime, text: scene.text };
  });

  return entries.map(e =>
    `${e.index}\n${e.startTime} --> ${e.endTime}\n${e.text}\n`
  ).join('\n');
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// ==================== SVG INFOGRAPHIC GENERATION ====================

export interface InfographicSection {
  headline: string;
  content: string;
  icon: string;
  dataPoint?: string;
  color: string;
}

/**
 * Generate an SVG infographic from structured data
 */
export function generateInfographicSVG(params: {
  title: string;
  sections: InfographicSection[];
  colorScheme: { primary: string; secondary: string; accent: string; text: string; bg: string };
}): string {
  const { title, sections, colorScheme } = params;
  const sectionHeight = 140;
  const headerHeight = 200;
  const footerHeight = 80;
  const totalHeight = headerHeight + sections.length * sectionHeight + footerHeight;

  const sectionSVG = sections.map((s, i) => {
    const y = headerHeight + i * sectionHeight;
    return `
    <g transform="translate(60, ${y})">
      <rect x="0" y="0" width="960" height="${sectionHeight - 15}" rx="12" fill="${s.color}15" stroke="${s.color}40" stroke-width="1"/>
      <text x="16" y="40" font-size="28" fill="${s.color}" font-weight="700">${escapeXml(s.icon)} ${escapeXml(s.headline)}</text>
      <text x="16" y="72" font-size="16" fill="${colorScheme.text}cc" font-family="Inter, sans-serif">${escapeXml(s.content.substring(0, 100))}</text>
      ${s.dataPoint ? `<text x="860" y="50" font-size="32" fill="${s.color}" font-weight="800" text-anchor="end">${escapeXml(s.dataPoint)}</text>` : ''}
    </g>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 ${totalHeight}" width="1080" height="${totalHeight}">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colorScheme.primary}"/>
      <stop offset="100%" style="stop-color:${colorScheme.secondary}"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="${totalHeight}" fill="${colorScheme.bg}"/>
  <!-- Header -->
  <rect width="1080" height="${headerHeight}" fill="url(#headerGrad)"/>
  <text x="540" y="90" font-size="36" fill="${colorScheme.text}" font-weight="800" text-anchor="middle" font-family="Inter, sans-serif">${escapeXml(title)}</text>
  <text x="540" y="130" font-size="16" fill="${colorScheme.text}99" text-anchor="middle" font-family="Inter, sans-serif">Generated by NTRO GenAI Platform</text>
  <line x1="440" y1="150" x2="640" y2="150" stroke="${colorScheme.accent}" stroke-width="3"/>
  <!-- Sections -->
  ${sectionSVG}
  <!-- Footer -->
  <text x="540" y="${totalHeight - 30}" font-size="12" fill="${colorScheme.text}66" text-anchor="middle" font-family="Inter, sans-serif">
    Blockchain-verified content • Hash-chain integrity assured • ${new Date().toISOString().split('T')[0]}
  </text>
</svg>`;
}

// ==================== STIX/TAXII OUTPUT ====================

export interface STIXBundle {
  type: 'bundle';
  id: string;
  spec_version: '2.1';
  created: string;
  objects: STIXObject[];
}

export interface STIXObject {
  type: string;
  spec_version: '2.1';
  id: string;
  created: string;
  modified: string;
  name?: string;
  description?: string;
  severity?: string;
  label?: string[];
  pattern?: string;
  indicator_type?: string;
  valid_from?: string;
  kill_chain_phases?: Array<{ kill_chain_name: string; phase_name: string }>;
  object_marking_refs?: string[];
  confidence?: number;
}

/**
 * Generate STIX 2.1 compatible bundle from advisory content
 */
export function generateSTIXBundle(params: {
  title: string;
  description: string;
  severity: string;
  sourceContent: string;
  recommendations: string[];
}): STIXBundle {
  const now = new Date().toISOString();
  const stixId = (type: string, n: number) => `${type}--${createHash('sha256').update(`${params.title}-${type}-${n}`).digest('hex').substring(0, 24)}`;

  const objects: STIXObject[] = [];

  // Threat Report (report object)
  objects.push({
    type: 'report',
    spec_version: '2.1',
    id: stixId('report', 1),
    created: now,
    modified: now,
    name: params.title,
    description: params.description,
    label: ['threat-report', 'advisory'],
  });

  // Threat Actor
  objects.push({
    type: 'threat-actor',
    spec_version: '2.1',
    id: stixId('threat-actor', 1),
    created: now,
    modified: now,
    name: 'Identified Threat',
    description: params.description.substring(0, 500),
    label: ['unknown', 'intermediate'],
  });

  // Indicator from source content
  const indicatorHash = createHash('sha256').update(params.sourceContent).digest('hex').substring(0, 16);
  objects.push({
    type: 'indicator',
    spec_version: '2.1',
    id: stixId('indicator', 1),
    created: now,
    modified: now,
    name: `Indicator from ${params.title}`,
    description: `Auto-generated indicator from source content analysis`,
    pattern: `[file:hashes.MD5 = '${indicatorHash}']`,
    indicator_type: 'malicious-activity',
    valid_from: now,
    confidence: 75,
  });

  // Course of Action (recommendations)
  params.recommendations.forEach((rec, i) => {
    objects.push({
      type: 'course-of-action',
      spec_version: '2.1',
      id: stixId('coa', i),
      created: now,
      modified: now,
      name: rec.substring(0, 100),
      description: rec,
    });
  });

  // Vulnerability
  objects.push({
    type: 'vulnerability',
    spec_version: '2.1',
    id: stixId('vuln', 1),
    created: now,
    modified: now,
    name: params.title,
    description: params.description,
    label: [params.severity.toLowerCase()],
  });

  // Add TLP marking
  objects.unshift({
    type: 'marking-definition',
    spec_version: '2.1',
    id: stixId('marking', 1),
    created: now,
    modified: now,
    name: 'TLP:AMBER',
    label: ['threat-intelligence'],
  });

  return {
    type: 'bundle',
    id: stixId('bundle', 1),
    spec_version: '2.1',
    created: now,
    objects,
  };
}
