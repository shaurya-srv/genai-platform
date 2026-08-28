/**
 * PPTX Generator — Creates real .pptx files (ZIP-based OOXML)
 * 
 * A PPTX file is a ZIP archive containing XML files following the
 * Office Open XML (OOXML) standard. This generator builds a minimal
 * but valid PPTX from slide data.
 * 
 * Works in Node.js using built-in zlib for compression.
 */

import { createHash } from 'crypto';
import { deflateSync } from 'zlib';

// ==================== TYPES ====================

export interface PPTXSlideData {
  title: string;
  content: string[];
  notes: string;
  layout: 'title' | 'content' | 'twoColumn' | 'conclusion';
}

export interface PPTXResult {
  buffer: Buffer;
  fileName: string;
  slideCount: number;
}

// ==================== ZIP BUILDER ====================

interface ZipEntry {
  name: string;
  data: Buffer;
  compressed: Buffer;
  crc: number;
  offset: number;
}

function crc32(buf: Buffer): number {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function buildZip(files: Map<string, Buffer>): Buffer {
  const entries: ZipEntry[] = [];
  let offset = 0;

  // Compress each file
  for (const [name, data] of files) {
    const compressed = deflateSync(data);
    const crcVal = crc32(data);
    entries.push({ name, data, compressed, crc: crcVal, offset });
    offset += 30 + name.length + compressed.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;

  // Build central directory
  for (const entry of entries) {
    centralDirSize += 46 + entry.name.length;
  }

  const totalSize = offset + centralDirSize + 22;
  const buf = Buffer.alloc(totalSize);
  let pos = 0;

  // Write local file headers + data
  for (const entry of entries) {
    // Local file header signature
    buf.writeUInt32LE(0x04034B50, pos); pos += 4;
    buf.writeUInt16LE(20, pos); pos += 2; // version needed
    buf.writeUInt16LE(0, pos); pos += 2;  // flags
    buf.writeUInt16LE(8, pos); pos += 2;  // compression method (deflate)
    buf.writeUInt16LE(0, pos); pos += 2;  // mod time
    buf.writeUInt16LE(0, pos); pos += 2;  // mod date
    buf.writeUInt32LE(entry.crc, pos); pos += 4;
    buf.writeUInt32LE(entry.compressed.length, pos); pos += 4;
    buf.writeUInt32LE(entry.data.length, pos); pos += 4;
    buf.writeUInt16LE(entry.name.length, pos); pos += 2;
    buf.writeUInt16LE(0, pos); pos += 2;  // extra field length
    buf.write(entry.name, pos, 'utf8'); pos += entry.name.length;
    entry.compressed.copy(buf, pos); pos += entry.compressed.length;
  }

  // Write central directory
  for (const entry of entries) {
    buf.writeUInt32LE(0x02014B50, pos); pos += 4;
    buf.writeUInt16LE(20, pos); pos += 2;  // version made by
    buf.writeUInt16LE(20, pos); pos += 2;  // version needed
    buf.writeUInt16LE(0, pos); pos += 2;  // flags
    buf.writeUInt16LE(8, pos); pos += 2;  // compression
    buf.writeUInt16LE(0, pos); pos += 2;  // mod time
    buf.writeUInt16LE(0, pos); pos += 2;  // mod date
    buf.writeUInt32LE(entry.crc, pos); pos += 4;
    buf.writeUInt32LE(entry.compressed.length, pos); pos += 4;
    buf.writeUInt32LE(entry.data.length, pos); pos += 4;
    buf.writeUInt16LE(entry.name.length, pos); pos += 2;
    buf.writeUInt16LE(0, pos); pos += 2;  // extra
    buf.writeUInt16LE(0, pos); pos += 2;  // comment
    buf.writeUInt16LE(0, pos); pos += 2;  // disk start
    buf.writeUInt16LE(0, pos); pos += 2;  // internal attrs
    buf.writeUInt32LE(0, pos); pos += 4;  // external attrs
    buf.writeUInt32LE(entry.offset, pos); pos += 4;
    buf.write(entry.name, pos, 'utf8'); pos += entry.name.length;
  }

  // End of central directory
  buf.writeUInt32LE(0x06054B50, pos); pos += 4;
  buf.writeUInt16LE(0, pos); pos += 2;  // disk number
  buf.writeUInt16LE(0, pos); pos += 2;  // disk with central dir
  buf.writeUInt16LE(entries.length, pos); pos += 2;
  buf.writeUInt16LE(entries.length, pos); pos += 2;
  buf.writeUInt32LE(centralDirSize, pos); pos += 4;
  buf.writeUInt32LE(centralDirOffset, pos); pos += 4;
  buf.writeUInt16LE(0, pos); pos += 2;

  return buf;
}

// ==================== OOXML GENERATORS ====================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateContentTypes(slides: PPTXSlideData[]): string {
  const slideOverrides = slides.map((_, i) =>
    `  <Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  ${slideOverrides}
</Types>`;
}

function generateRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;
}

function generatePresentationRels(slides: PPTXSlideData[]): string {
  const slideRels = slides.map((_, i) =>
    `  <Relationship Id="rId${i + 10}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="slideLayouts/slideLayout1.xml"/>
  ${slideRels}
</Relationships>`;
}

function generateSlideRels(slideIndex: number): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;
}

function generatePresentation(slides: PPTXSlideData[]): string {
  const sldIdLst = slides.map((_, i) =>
    `    <p:sldId id="${256 + i}" r:id="rId${i + 10}"/>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
${sldIdLst}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
}

function generateSlideMaster(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:bg>
      <p:bgRef idx="1001">
        <a:schemeClr val="bg1"/>
      </p:bgRef>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
</p:sldMaster>`;
}

function generateSlideLayout(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             type="blank">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    </p:spTree>
  </p:cSld>
</p:sldLayout>`;
}

function generateSlide(slide: PPTXSlideData, index: number, totalSlides: number): string {
  const isTitleSlide = slide.layout === 'title' || index === 0;
  const isConclusion = slide.layout === 'conclusion' || index === totalSlides - 1;

  // Build title shape
  const titleY = isTitleSlide ? '2000000' : '400000';
  const titleHeight = isTitleSlide ? '2000000' : '1200000';
  const titleSize = isTitleSlide ? '4400' : '3600';

  // Build content shapes
  const contentShapes = slide.content.map((line, i) => {
    const y = 1800000 + i * 550000;
    return `
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${10 + i}" name="Content ${i + 1}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="800000" y="${y}"/>
            <a:ext cx="7600000" cy="500000"/>
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p>
            <a:pPr>
              <a:buFont typeface="Arial" panose="020B0604020202020204"/>
              <a:buChar char="${isConclusion ? '★' : '●'}"/>
            </a:pPr>
            <a:r>
              <a:rPr lang="en-US" sz="2000" dirty="0">
                <a:solidFill><a:srgbClr val="333333"/></a:solidFill>
              </a:rPr>
              <a:t>${escapeXml(line)}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>`;
  }).join('');

  // Speaker notes shape
  const notesShape = slide.notes ? `
    <p:sp>
      <p:nvSpPr><p:cNvPr id="100" name="Notes"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></a:xfrm>
      </p:spPr>
      <p:txBody>
        <a:bodyPr/>
        <a:p><a:r><a:rPr lang="en-US" sz="1200"/><a:t>${escapeXml(slide.notes)}</a:t></a:r></a:p>
      </p:txBody>
    </p:sp>` : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:bg>
      <p:bgRef idx="1001"><a:schemeClr val="${isTitleSlide ? 'dk1' : 'lt1'}"/></p:bgRef>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      ${isTitleSlide ? `
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="ctrTitle"/></p:nvPr></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="600000" y="2200000"/><a:ext cx="7900000" cy="1600000"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p>
            <a:pPr algn="ctr"/>
            <a:r><a:rPr lang="en-US" sz="${titleSize}" b="1" dirty="0"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr><a:t>${escapeXml(slide.title)}</a:t></a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Subtitle"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="1500000" y="4200000"/><a:ext cx="6100000" cy="800000"/></a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p>
            <a:pPr algn="ctr"/>
            <a:r><a:rPr lang="en-US" sz="2000" dirty="0"><a:solidFill><a:srgbClr val="CCCCCC"/></a:solidFill></a:rPr><a:t>${escapeXml(slide.content[0] || '')}</a:t></a:r>
          </a:p>
        </p:txBody>
      </p:sp>` : `
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="500000" y="300000"/><a:ext cx="8200000" cy="1000000"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p>
            <a:r><a:rPr lang="en-US" sz="${titleSize}" b="1" dirty="0"><a:solidFill><a:srgbClr val="1a1a2e"/></a:solidFill></a:rPr><a:t>${escapeXml(slide.title)}</a:t></a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      ${contentShapes}`}
      ${notesShape}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

// ==================== MAIN GENERATOR ====================

export function generatePPTXFile(slides: PPTXSlideData[], title: string): PPTXResult {
  const files = new Map<string, Buffer>();

  // [Content_Types].xml
  files.set('[Content_Types].xml', Buffer.from(generateContentTypes(slides), 'utf8'));

  // _rels/.rels
  files.set('_rels/.rels', Buffer.from(generateRels(), 'utf8'));

  // ppt/presentation.xml
  files.set('ppt/presentation.xml', Buffer.from(generatePresentation(slides), 'utf8'));

  // ppt/_rels/presentation.xml.rels
  files.set('ppt/_rels/presentation.xml.rels', Buffer.from(generatePresentationRels(slides), 'utf8'));

  // ppt/slideMasters/slideMaster1.xml
  files.set('ppt/slideMasters/slideMaster1.xml', Buffer.from(generateSlideMaster(), 'utf8'));

  // ppt/slideLayouts/slideLayout1.xml
  files.set('ppt/slideLayouts/slideLayout1.xml', Buffer.from(generateSlideLayout(), 'utf8'));

  // Slides
  for (let i = 0; i < slides.length; i++) {
    const slideXml = generateSlide(slides[i], i, slides.length);
    files.set(`ppt/slides/slide${i + 1}.xml`, Buffer.from(slideXml, 'utf8'));
    files.set(`ppt/slides/_rels/slide${i + 1}.xml.rels`, Buffer.from(generateSlideRels(i), 'utf8'));
  }

  const buffer = buildZip(files);
  const safeName = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').substring(0, 50);

  return {
    buffer,
    fileName: `${safeName || 'presentation'}.pptx`,
    slideCount: slides.length,
  };
}
