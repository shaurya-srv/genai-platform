/**
 * PDF Audit Report Generator
 * 
 * Generates branded government-style PDF reports for:
 * - Approval chain summary
 * - Blockchain audit trail
 * - Compliance report
 * - Content transformation summary
 * 
 * Uses jsPDF for PDF generation.
 */

import jsPDF from 'jspdf';

// ==================== TYPES ====================

export interface ReportData {
  title: string;
  subtitle?: string;
  generatedAt: string;
  generatedBy: string;
  classification: string;  // CONFIDENTIAL, RESTRICTED, etc.
  
  sections: ReportSection[];
}

export interface ReportSection {
  title: string;
  content: string | ReportTable | ReportTimeline;
  type: 'text' | 'table' | 'timeline';
}

export interface ReportTable {
  type?: string;
  headers: string[];
  rows: string[][];
}

export interface ReportTimeline {
  type?: string;
  events: Array<{
    timestamp: string;
    event: string;
    actor: string;
    details: string;
  }>;
}

// ==================== REPORT GENERATOR ====================

export class PDFReportGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.margin = 20;
    this.currentY = 0;
  }

  /**
   * Generate an approval chain report
   */
  static generateApprovalReport(params: {
    request: {
      id: string;
      title: string;
      submittedBy: string;
      submittedByName: string;
      riskLevel: string;
      status: string;
      outputTypes: string[];
      chain: Array<{
        stepNumber: number;
        requiredRoleName: string;
        approverName?: string;
        decision?: string;
        decisionAt?: number;
        comments?: string;
        status: string;
      }>;
    };
    generatedBy: string;
  }): Blob {
    const gen = new PDFReportGenerator();
    const { request } = params;
    
    // Header
    gen.addHeader('APPROVAL CHAIN REPORT', request.title, params.generatedBy);
    
    // Request details
    gen.addSection('Request Details', {
      type: 'table',
      headers: ['Field', 'Value'],
      rows: [
        ['Request ID', request.id],
        ['Title', request.title],
        ['Submitted By', request.submittedByName],
        ['Risk Level', request.riskLevel],
        ['Status', request.status],
        ['Output Types', request.outputTypes.join(', ')],
        ['Chain Steps', String(request.chain.length)],
      ],
    }, 'table');
    
    // Chain timeline
    gen.addSection('Approval Chain Timeline', {
      type: 'timeline',
      events: request.chain.map(step => ({
        timestamp: step.decisionAt ? new Date(step.decisionAt).toISOString() : 'Pending',
        event: `Step ${step.stepNumber}: ${step.status}`,
        actor: step.approverName || 'Awaiting approver',
        details: `${step.requiredRoleName} — ${step.decision || 'No decision yet'}${step.comments ? ` (${step.comments})` : ''}`,
      })),
    }, 'timeline');
    
    // Footer
    gen.addFooter();
    
    return gen.doc.output('blob');
  }

  /**
   * Generate a blockchain audit trail report
   */
  static generateAuditReport(params: {
    blocks: Array<{
      blockNumber: number;
      eventType: string;
      actor: string;
      actorRole: string;
      timestamp: number;
      contentHash: string;
      metadata: Record<string, any>;
    }>;
    chainValid: boolean;
    generatedBy: string;
  }): Blob {
    const gen = new PDFReportGenerator();
    
    gen.addHeader('BLOCKCHAIN AUDIT TRAIL', `Chain Integrity: ${params.chainValid ? 'VALID ✓' : 'BROKEN ✗'}`, params.generatedBy);
    
    gen.addSection('Chain Summary', {
      type: 'table',
      headers: ['Metric', 'Value'],
      rows: [
        ['Total Blocks', String(params.blocks.length)],
        ['Chain Status', params.chainValid ? 'VALID' : 'COMPROMISED'],
        ['First Block', params.blocks[0] ? new Date(params.blocks[0].timestamp).toISOString() : 'N/A'],
        ['Latest Block', params.blocks.length > 0 ? new Date(params.blocks[params.blocks.length - 1].timestamp).toISOString() : 'N/A'],
      ],
    }, 'table');
    
    gen.addSection('Audit Events', {
      type: 'table',
      headers: ['Block #', 'Event', 'Actor', 'Timestamp', 'Hash'],
      rows: params.blocks.map(b => [
        `#${b.blockNumber}`,
        b.eventType,
        b.actor,
        new Date(b.timestamp).toLocaleString(),
        b.contentHash.substring(0, 16) + '...',
      ]),
    }, 'table');
    
    gen.addFooter();
    return gen.doc.output('blob');
  }

  /**
   * Generate a compliance report
   */
  static generateComplianceReport(params: {
    contentTitle: string;
    checks: Array<{
      regulation: string;
      status: string;
      score: number;
      findings: string[];
    }>;
    overallScore: number;
    generatedBy: string;
  }): Blob {
    const gen = new PDFReportGenerator();
    
    gen.addHeader('COMPLIANCE REPORT', params.contentTitle, params.generatedBy);
    
    gen.addSection('Overall Compliance', {
      type: 'table',
      headers: ['Metric', 'Value'],
      rows: [
        ['Content', params.contentTitle],
        ['Overall Score', `${params.overallScore}/100`],
        ['Regulations Checked', String(params.checks.length)],
        ['Compliant', params.checks.every(c => c.status === 'Compliant') ? 'YES ✓' : 'NO ✗'],
      ],
    }, 'table');
    
    for (const check of params.checks) {
      gen.addSection(`${check.regulation} — ${check.status} (${check.score}/100)`, check.findings.join('\n'), 'text');
    }
    
    gen.addFooter();
    return gen.doc.output('blob');
  }

  // ==================== INTERNAL METHODS ====================

  private addHeader(title: string, subtitle: string, generatedBy: string) {
    const doc = this.doc;
    
    // Header background
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, this.pageWidth, 45, 'F');
    
    // Classification banner
    doc.setFillColor(220, 38, 38); // red
    doc.rect(0, 0, this.pageWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('CONFIDENTIAL — GOVERNMENT USE ONLY', this.pageWidth / 2, 5.5, { align: 'center' });
    
    // Title
    doc.setTextColor(241, 245, 249);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, this.margin, 22);
    
    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(subtitle, this.margin, 30);
    
    // Meta
    doc.setFontSize(7);
    doc.text(`Generated: ${new Date().toISOString()} | By: ${generatedBy} | NTRO GenAI Platform`, this.margin, 38);
    
    this.currentY = 55;
  }

  private addSection(title: string, content: string | ReportTable | ReportTimeline, type: string) {
    const doc = this.doc;
    
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 50) {
      doc.addPage();
      this.currentY = 20;
    }
    
    // Section title
    doc.setFillColor(59, 130, 246); // #3b82f6
    doc.rect(this.margin, this.currentY - 4, 3, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(title, this.margin + 6, this.currentY + 1);
    this.currentY += 10;
    
    if (type === 'table' && typeof content === 'object' && 'headers' in content) {
      this.drawTable(content as ReportTable);
    } else if (type === 'timeline' && typeof content === 'object' && 'events' in content) {
      this.drawTimeline(content as ReportTimeline);
    } else if (type === 'text' && typeof content === 'string') {
      this.drawText(content);
    }
    
    this.currentY += 8;
  }

  private drawTable(table: ReportTable) {
    const doc = this.doc;
    const colWidth = (this.pageWidth - 2 * this.margin) / table.headers.length;
    
    // Header row
    doc.setFillColor(241, 245, 249);
    doc.rect(this.margin, this.currentY - 3, this.pageWidth - 2 * this.margin, 8, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    table.headers.forEach((h, i) => {
      doc.text(h, this.margin + i * colWidth + 2, this.currentY + 2);
    });
    this.currentY += 8;
    
    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    for (const row of table.rows) {
      if (this.currentY > this.pageHeight - 30) {
        doc.addPage();
        this.currentY = 20;
      }
      
      doc.setTextColor(71, 85, 105);
      row.forEach((cell, i) => {
        const text = String(cell).substring(0, 50);
        doc.text(text, this.margin + i * colWidth + 2, this.currentY);
      });
      
      // Row separator
      doc.setDrawColor(226, 232, 240);
      doc.line(this.margin, this.currentY + 2, this.pageWidth - this.margin, this.currentY + 2);
      this.currentY += 6;
    }
  }

  private drawTimeline(timeline: ReportTimeline) {
    const doc = this.doc;
    
    for (const event of timeline.events) {
      if (this.currentY > this.pageHeight - 30) {
        doc.addPage();
        this.currentY = 20;
      }
      
      // Timeline dot
      doc.setFillColor(59, 130, 246);
      doc.circle(this.margin + 3, this.currentY, 1.5, 'F');
      
      // Timeline line
      doc.setDrawColor(226, 232, 240);
      doc.line(this.margin + 3, this.currentY + 1.5, this.margin + 3, this.currentY + 6);
      
      // Event details
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`${event.event} — ${event.actor}`, this.margin + 8, this.currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(event.details.substring(0, 80), this.margin + 8, this.currentY + 4);
      doc.text(event.timestamp, this.pageWidth - this.margin - 30, this.currentY);
      
      this.currentY += 8;
    }
  }

  private drawText(text: string) {
    const doc = this.doc;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    
    const lines = doc.splitTextToSize(text, this.pageWidth - 2 * this.margin);
    for (const line of lines) {
      if (this.currentY > this.pageHeight - 30) {
        doc.addPage();
        this.currentY = 20;
      }
      doc.text(line, this.margin, this.currentY);
      this.currentY += 4;
    }
  }

  private addFooter() {
    const doc = this.doc;
    const totalPages = doc.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(226, 232, 240);
      doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
      
      // Footer text
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('NTRO GenAI Platform — Secure Content Management', this.margin, this.pageHeight - 10);
      doc.text(`Page ${i} of ${totalPages}`, this.pageWidth - this.margin, this.pageHeight - 10, { align: 'right' });
      doc.text(`Generated: ${new Date().toISOString()}`, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });
    }
  }
}
