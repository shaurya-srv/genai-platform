/**
 * Email Notification Service
 * 
 * Sends email alerts when the approval chain advances to the next step.
 * 
 * - With SMTP configured: sends real HTML emails via nodemailer
 * - Without SMTP: logs to console and stores in-memory for in-app display
 * 
 * Environment variables:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=your-email@gmail.com
 *   SMTP_PASS=your-app-password
 */

import nodemailer from 'nodemailer';
import { AuthService, ROLE_LEVEL_LABELS, RoleLevel } from './auth';

// ==================== TYPES ====================

export interface Notification {
  id: string;
  type: 'approval_request' | 'approval_granted' | 'approval_rejected' | 'chain_advanced' | 'chain_completed' | 'chain_expired' | 'publish_complete';
  toUserId: string;
  toEmail: string;
  toName: string;
  subject: string;
  body: string;
  htmlBody: string;
  requestId: string;
  timestamp: number;
  sent: boolean;
  channel: 'email' | 'in_app' | 'both';
}

// ==================== IN-MEMORY STORE ====================

const notifications: Notification[] = [];
let emailTransporter: nodemailer.Transporter | null = null;

// ==================== SMTP SETUP ====================

function getTransporter(): nodemailer.Transporter | null {
  if (emailTransporter) return emailTransporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  emailTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return emailTransporter;
}

// ==================== NOTIFICATION SERVICE ====================

export class NotificationService {
  /**
   * Send approval request to the next approver in the chain
   */
  static async notifyApprovalRequest(params: {
    requestId: string;
    approverId: string;
    submitterName: string;
    contentTitle: string;
    riskLevel: string;
    chainStep: number;
    totalSteps: number;
    deadline: number;
  }): Promise<Notification> {
    const user = AuthService.getUser(params.approverId);
    const email = user?.email || user?.googleEmail || '';
    const levelInfo = ROLE_LEVEL_LABELS[user?.roleLevel as RoleLevel];
    const timeLeft = Math.round((params.deadline - Date.now()) / (1000 * 60 * 60));

    const subject = `📋 Approval Required: "${params.contentTitle}"`;
    const body = [
      `Hello ${user?.displayName || 'Approver'},`,
      ``,
      `You have a new content approval request waiting for your review.`,
      ``,
      `Content: ${params.contentTitle}`,
      `Submitted by: ${params.submitterName}`,
      `Risk Level: ${params.riskLevel}`,
      `Chain Step: ${params.chainStep} of ${params.totalSteps}`,
      `Your Role: ${levelInfo?.label || user?.roleLevel}`,
      `Deadline: ${timeLeft} hours remaining`,
      ``,
      `Please review and approve or reject this content.`,
      ``,
      `— NTRO GenAI Platform`,
    ].join('\n');

    const htmlBody = buildEmailHTML({
      title: '📋 Approval Required',
      heading: params.contentTitle,
      color: params.riskLevel === 'CRITICAL' ? '#dc2626' : params.riskLevel === 'HIGH' ? '#f59e0b' : '#3b82f6',
      fields: [
        { label: 'Submitted by', value: params.submitterName },
        { label: 'Risk Level', value: params.riskLevel },
        { label: 'Chain Progress', value: `Step ${params.chainStep} of ${params.totalSteps}` },
        { label: 'Your Role', value: levelInfo?.label || user?.roleLevel || '' },
        { label: 'Deadline', value: `${timeLeft} hours remaining` },
      ],
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?portal=${user?.role || 'APPROVER'}`,
      actionLabel: 'Review & Approve',
    });

    return this.send({
      type: 'approval_request',
      toUserId: params.approverId,
      toEmail: email,
      toName: user?.displayName || 'Approver',
      subject,
      body,
      htmlBody,
      requestId: params.requestId,
      channel: 'both',
    });
  }

  /**
   * Notify the submitter that their content was approved/rejected
   */
  static async notifyDecision(params: {
    requestId: string;
    submitterId: string;
    contentTitle: string;
    decision: 'APPROVED' | 'REJECTED';
    approverName: string;
    comments?: string;
  }): Promise<Notification> {
    const user = AuthService.getUser(params.submitterId);
    const email = user?.email || user?.googleEmail || '';
    const isApproved = params.decision === 'APPROVED';

    const subject = `${isApproved ? '✅' : '❌'} ${params.decision}: "${params.contentTitle}"`;
    const body = [
      `Hello ${user?.displayName || 'User'},`,
      ``,
      `Your content "${params.contentTitle}" has been ${params.decision.toLowerCase()} by ${params.approverName}.`,
      params.comments ? `\nComments: ${params.comments}` : '',
      ``,
      isApproved
        ? `The content will now be auto-published to your linked platforms.`
        : `Please review the feedback and resubmit if needed.`,
      ``,
      `— NTRO GenAI Platform`,
    ].join('\n');

    const htmlBody = buildEmailHTML({
      title: isApproved ? '✅ Content Approved' : '❌ Content Rejected',
      heading: params.contentTitle,
      color: isApproved ? '#10b981' : '#ef4444',
      fields: [
        { label: 'Decision', value: params.decision },
        { label: 'Reviewed by', value: params.approverName },
        ...(params.comments ? [{ label: 'Comments', value: params.comments }] : []),
      ],
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
      actionLabel: isApproved ? 'View Published Content' : 'View & Resubmit',
    });

    return this.send({
      type: isApproved ? 'approval_granted' : 'approval_rejected',
      toUserId: params.submitterId,
      toEmail: email,
      toName: user?.displayName || 'User',
      subject,
      body,
      htmlBody,
      requestId: params.requestId,
      channel: 'both',
    });
  }

  /**
   * Notify that the chain advanced to the next approver
   */
  static async notifyChainAdvanced(params: {
    requestId: string;
    submitterId: string;
    contentTitle: string;
    completedBy: string;
    nextApproverName: string;
    nextStep: number;
    totalSteps: number;
  }): Promise<Notification> {
    const user = AuthService.getUser(params.submitterId);
    const email = user?.email || user?.googleEmail || '';

    const subject = `🔄 Chain Advanced: "${params.contentTitle}" — now with ${params.nextApproverName}`;
    const body = [
      `Hello ${user?.displayName || 'User'},`,
      ``,
      `Your approval chain for "${params.contentTitle}" has advanced.`,
      ``,
      `${params.completedBy} approved at step ${params.nextStep - 1}.`,
      `Now awaiting review from: ${params.nextApproverName}`,
      `Progress: Step ${params.nextStep} of ${params.totalSteps}`,
      ``,
      `— NTRO GenAI Platform`,
    ].join('\n');

    const htmlBody = buildEmailHTML({
      title: '🔄 Approval Chain Advanced',
      heading: params.contentTitle,
      color: '#8b5cf6',
      fields: [
        { label: 'Approved by', value: params.completedBy },
        { label: 'Now awaiting', value: params.nextApproverName },
        { label: 'Progress', value: `Step ${params.nextStep} of ${params.totalSteps}` },
      ],
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
      actionLabel: 'View Progress',
    });

    return this.send({
      type: 'chain_advanced',
      toUserId: params.submitterId,
      toEmail: email,
      toName: user?.displayName || 'User',
      subject,
      body,
      htmlBody,
      requestId: params.requestId,
      channel: 'both',
    });
  }

  /**
   * Notify that the chain is fully approved and content was published
   */
  static async notifyChainCompleted(params: {
    requestId: string;
    submitterId: string;
    contentTitle: string;
    approvedBy: string;
    publishResults: Array<{ platform: string; success: boolean; error?: string }>;
  }): Promise<Notification> {
    const user = AuthService.getUser(params.submitterId);
    const email = user?.email || user?.googleEmail || '';

    const publishSummary = params.publishResults
      .map(r => `  ${r.platform}: ${r.success ? '✅ Published' : `❌ Failed — ${r.error || 'Unknown error'}`}`)
      .join('\n');

    const subject = `🎉 Chain Complete: "${params.contentTitle}" — Published!`;
    const body = [
      `Hello ${user?.displayName || 'User'},`,
      ``,
      `Great news! Your content "${params.contentTitle}" has been fully approved and published.`,
      ``,
      `Approved by: ${params.approvedBy}`,
      `Publish Results:`,
      publishSummary,
      ``,
      `— NTRO GenAI Platform`,
    ].join('\n');

    const htmlBody = buildEmailHTML({
      title: '🎉 Content Approved & Published',
      heading: params.contentTitle,
      color: '#10b981',
      fields: [
        { label: 'Final Approver', value: params.approvedBy },
        ...params.publishResults.map(r => ({
          label: r.platform,
          value: r.success ? '✅ Published' : `❌ ${r.error || 'Failed'}`,
        })),
      ],
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
      actionLabel: 'View Dashboard',
    });

    return this.send({
      type: 'chain_completed',
      toUserId: params.submitterId,
      toEmail: email,
      toName: user?.displayName || 'User',
      subject,
      body,
      htmlBody,
      requestId: params.requestId,
      channel: 'both',
    });
  }

  /**
   * Core send method — tries email first, falls back to in-app
   */
  private static async send(params: {
    type: Notification['type'];
    toUserId: string;
    toEmail: string;
    toName: string;
    subject: string;
    body: string;
    htmlBody: string;
    requestId: string;
    channel: 'email' | 'in_app' | 'both';
  }): Promise<Notification> {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: params.type,
      toUserId: params.toUserId,
      toEmail: params.toEmail,
      toName: params.toName,
      subject: params.subject,
      body: params.body,
      htmlBody: params.htmlBody,
      requestId: params.requestId,
      timestamp: Date.now(),
      sent: false,
      channel: params.channel,
    };

    // Try email
    if ((params.channel === 'email' || params.channel === 'both') && params.toEmail) {
      const transporter = getTransporter();
      if (transporter) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || `"NTRO GenAI Platform" <${process.env.SMTP_USER}>`,
            to: params.toEmail,
            subject: params.subject,
            text: params.body,
            html: params.htmlBody,
          });
          notification.sent = true;
          console.log(`[Email] Sent "${params.subject}" to ${params.toEmail}`);
        } catch (e) {
          console.error(`[Email] Failed to send to ${params.toEmail}:`, e);
        }
      } else {
        console.log(`[Email] SMTP not configured — logging notification:`);
        console.log(`  To: ${params.toEmail}`);
        console.log(`  Subject: ${params.subject}`);
        console.log(`  Body: ${params.body.substring(0, 200)}`);
      }
    }

    // Store in memory for in-app display
    notifications.push(notification);
    return notification;
  }

  /**
   * Get notifications for a user
   */
  static getForUser(userId: string): Notification[] {
    return notifications
      .filter(n => n.toUserId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get all notifications (admin)
   */
  static getAll(): Notification[] {
    return [...notifications].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get notification count for a user
   */
  static getUnreadCount(userId: string): number {
    // For now, count all notifications as unread (no read tracking yet)
    return notifications.filter(n => n.toUserId === userId && !n.sent).length;
  }

  /**
   * Check if SMTP is configured
   */
  static isEmailConfigured(): boolean {
    return !!getTransporter();
  }
}

// ==================== EMAIL HTML TEMPLATE ====================

function buildEmailHTML(params: {
  title: string;
  heading: string;
  color: string;
  fields: Array<{ label: string; value: string }>;
  actionUrl: string;
  actionLabel: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:rgba(15,23,42,0.9);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
      <div style="padding:24px 32px;background:${params.color}20;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div style="font-size:20px;font-weight:800;color:#f1f5f9;">${params.title}</div>
      </div>
      <div style="padding:24px 32px;">
        <div style="font-size:16px;font-weight:700;color:#f1f5f9;margin-bottom:16px;">${params.heading}</div>
        ${params.fields.map(f => `
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
          <span style="font-size:14px;color:#94a3b8;">${f.label}</span>
          <span style="font-size:14px;color:#f1f5f9;font-weight:600;">${f.value}</span>
        </div>`).join('')}
        <div style="margin-top:24px;text-align:center;">
          <a href="${params.actionUrl}" style="display:inline-block;padding:12px 32px;border-radius:8px;background:linear-gradient(135deg,${params.color},${params.color}cc);color:#fff;font-size:14px;font-weight:700;text-decoration:none;">${params.actionLabel}</a>
        </div>
      </div>
      <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <span style="font-size:12px;color:#64748b;">NTRO GenAI Platform • Secure Content Management</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}
