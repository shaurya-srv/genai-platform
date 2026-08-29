/**
 * PPTX Generator — Uses pptxgenjs for reliable, standards-compliant .pptx files.
 *
 * pptxgenjs handles all OOXML boilerplate, ZIP packaging, and ensures
 * the output opens correctly in PowerPoint, Google Slides, etc.
 */

import PptxGenJS from 'pptxgenjs';

// ==================== TYPES ====================

export interface PPTXSlideData {
  title: string;
  content: string[];
  notes: string;
  layout: 'title' | 'content' | 'twoColumn' | 'conclusion';
  accentColor?: string;
}

export interface PPTXResult {
  buffer: Buffer;
  fileName: string;
  slideCount: number;
}

// ==================== COLOR HELPERS ====================

function hexToPptx(hex: string): string {
  return hex.replace(/^#/, '');
}

// ==================== MAIN GENERATOR ====================

export async function generatePPTXFile(slides: PPTXSlideData[], title: string): Promise<PPTXResult> {
  const pptx = new PptxGenJS();

  // Presentation metadata
  pptx.author = 'NTRO GenAI Platform';
  pptx.company = 'NTRO';
  pptx.subject = title;
  pptx.title = title;
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches

  const totalSlides = slides.length;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const isTitleSlide = slide.layout === 'title' || i === 0;
    const isConclusion = slide.layout === 'conclusion' || i === totalSlides - 1;
    const accent = hexToPptx(slide.accentColor || '0f3460');

    if (isTitleSlide) {
      // ========== TITLE SLIDE ==========
      const slideObj = pptx.addSlide();
      slideObj.background = { color: '1a1a2e' };

      // Accent bar at bottom
      slideObj.addShape(pptx.ShapeType.rect, {
        x: 0, y: 4.5, w: 13.33, h: 3.0,
        fill: { color: accent },
      });

      // Title text
      slideObj.addText(slide.title.substring(0, 60), {
        x: 0.5, y: 1.5, w: 12.33, h: 2.0,
        fontSize: 40,
        fontFace: 'Calibri',
        color: 'FFFFFF',
        bold: true,
        align: 'center',
      });

      // Subtitle / first content line
      if (slide.content[0]) {
        slideObj.addText(slide.content[0].substring(0, 80), {
          x: 1.5, y: 3.5, w: 10.33, h: 0.8,
          fontSize: 18,
          fontFace: 'Calibri',
          color: 'CCCCCC',
          align: 'center',
        });
      }

      // Date
      slideObj.addText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), {
        x: 3, y: 5.8, w: 7.33, h: 0.5,
        fontSize: 14,
        fontFace: 'Calibri',
        color: 'FFFFFF',
        align: 'center',
      });

      // Speaker notes
      if (slide.notes) {
        slideObj.addNotes(slide.notes);
      }

    } else {
      // ========== CONTENT SLIDE ==========
      const slideObj = pptx.addSlide();
      slideObj.background = { color: 'FFFFFF' };

      // Accent bar at top
      slideObj.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: 13.33, h: 0.15,
        fill: { color: accent },
      });

      // Slide title
      slideObj.addText(slide.title.substring(0, 60), {
        x: 0.6, y: 0.3, w: 12, h: 0.8,
        fontSize: 26,
        fontFace: 'Calibri',
        color: accent,
        bold: true,
      });

      // Accent underline
      slideObj.addShape(pptx.ShapeType.rect, {
        x: 0.6, y: 1.05, w: 2.5, h: 0.06,
        fill: { color: accent },
      });

      // Bullet content
      const bulletColor = isConclusion ? 'e94560' : '333333';
      const bulletItems = slide.content.map((line, idx) => ({
        text: line.substring(0, 120),
        options: {
          fontSize: 16,
          fontFace: 'Calibri',
          color: bulletColor,
          bullet: { code: isConclusion ? '2605' : '25CF', color: accent },
          breakType: idx > 0 ? 'break' as const : undefined,
          paraSpaceAfter: 8,
        },
      }));

      slideObj.addText(bulletItems, {
        x: 0.6, y: 1.3, w: 12, h: 5.0,
        valign: 'top',
      });

      // Slide number
      slideObj.addText(`${i + 1} / ${totalSlides}`, {
        x: 5.5, y: 6.8, w: 2.33, h: 0.4,
        fontSize: 10,
        fontFace: 'Calibri',
        color: '999999',
        align: 'center',
      });

      // Speaker notes
      if (slide.notes) {
        slideObj.addNotes(slide.notes);
      }
    }
  }

  // Generate buffer
  const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
  const safeName = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').substring(0, 50);

  return {
    buffer,
    fileName: `${safeName || 'presentation'}.pptx`,
    slideCount: slides.length,
  };
}
