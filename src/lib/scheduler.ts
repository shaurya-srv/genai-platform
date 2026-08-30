/**
 * Content Scheduler
 * 
 * Queues approved content for scheduled publishing to social platforms.
 * Supports optimal timing recommendations, recurring posts, and
 * timezone-aware scheduling.
 * 
 * Flow: Approval Complete → Schedule → Auto-publish at scheduled time
 */

import { LinkageService, Platform } from './linkage';
import { AuthService } from './auth';

// ==================== TYPES ====================

export type ScheduleStatus = 'QUEUED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';

export interface ScheduledPost {
  id: string;
  userId: string;
  userName: string;
  
  // Content
  title: string;
  content: string;
  platform: Platform;
  accountId: string;
  accountName: string;
  
  // Scheduling
  scheduledAt: number;        // Unix timestamp
  timezone: string;
  publishedAt?: number;
  
  // Status
  status: ScheduleStatus;
  error?: string;
  
  // Metadata
  transformationId?: string;
  approvalRequestId?: string;
  createdAt: number;
  metadata: Record<string, any>;
}

export interface OptimalTimeSlot {
  platform: Platform;
  dayOfWeek: string;
  timeRange: string;
  reason: string;
}

// ==================== OPTIMAL TIMING DATA ====================

const OPTIMAL_TIMES: Record<Platform, OptimalTimeSlot[]> = {
  linkedin: [
    { platform: 'linkedin', dayOfWeek: 'Tuesday-Thursday', timeRange: '8:00-10:00 AM', reason: 'Highest professional engagement' },
    { platform: 'linkedin', dayOfWeek: 'Wednesday', timeRange: '12:00-1:00 PM', reason: 'Lunch break browsing peak' },
    { platform: 'linkedin', dayOfWeek: 'Tuesday', timeRange: '5:00-6:00 PM', reason: 'End-of-day catch-up' },
  ],
  twitter: [
    { platform: 'twitter', dayOfWeek: 'Monday-Friday', timeRange: '9:00-11:00 AM', reason: 'Morning news cycle peak' },
    { platform: 'twitter', dayOfWeek: 'Wednesday', timeRange: '12:00-3:00 PM', reason: 'Mid-day engagement spike' },
    { platform: 'twitter', dayOfWeek: 'Thursday-Friday', timeRange: '5:00-6:00 PM', reason: 'Evening scroll time' },
  ],
  email: [
    { platform: 'email', dayOfWeek: 'Tuesday-Thursday', timeRange: '10:00 AM', reason: 'Highest open rates' },
    { platform: 'email', dayOfWeek: 'Wednesday', timeRange: '2:00 PM', reason: 'After-lunch engagement' },
  ],
};

// ==================== IN-MEMORY STORE ====================

const scheduledPosts: Map<string, ScheduledPost> = new Map();
let schedulerInterval: ReturnType<typeof setInterval> | null = null;

// ==================== SCHEDULER SERVICE ====================

export class ContentScheduler {
  /**
   * Schedule a post for future publishing
   */
  static schedule(params: {
    userId: string;
    title: string;
    content: string;
    platform: Platform;
    accountId: string;
    accountName: string;
    scheduledAt: number;
    timezone?: string;
    transformationId?: string;
    approvalRequestId?: string;
  }): ScheduledPost {
    const user = AuthService.getUser(params.userId);
    
    const post: ScheduledPost = {
      id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      userName: user?.displayName || params.userId,
      title: params.title,
      content: params.content,
      platform: params.platform,
      accountId: params.accountId,
      accountName: params.accountName,
      scheduledAt: params.scheduledAt,
      timezone: params.timezone || 'Asia/Kolkata',
      status: 'QUEUED',
      createdAt: Date.now(),
      transformationId: params.transformationId,
      approvalRequestId: params.approvalRequestId,
      metadata: {},
    };
    
    scheduledPosts.set(post.id, post);
    return post;
  }

  /**
   * Schedule across multiple platforms
   */
  static scheduleMulti(params: {
    userId: string;
    title: string;
    content: string;
    platforms: Array<{ platform: Platform; accountId: string; accountName: string }>;
    scheduledAt: number;
    timezone?: string;
    staggerMinutes?: number;  // Space posts apart
  }): ScheduledPost[] {
    const stagger = params.staggerMinutes || 15;
    return params.platforms.map((p, i) =>
      this.schedule({
        ...params,
        platform: p.platform,
        accountId: p.accountId,
        accountName: p.accountName,
        scheduledAt: params.scheduledAt + (i * stagger * 60 * 1000),
      })
    );
  }

  /**
   * Get optimal next publish time for a platform
   */
  static getOptimalTime(platform: Platform): { timestamp: number; slot: OptimalTimeSlot } {
    const slots = OPTIMAL_TIMES[platform] || OPTIMAL_TIMES.linkedin;
    const now = new Date();
    
    // Find the next optimal slot
    for (const slot of slots) {
      const nextTime = this.findNextSlotTime(slot, now);
      if (nextTime > now.getTime()) {
        return { timestamp: nextTime, slot };
      }
    }
    
    // Fallback: tomorrow morning
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return { timestamp: tomorrow.getTime(), slot: slots[0] };
  }

  /**
   * Get all scheduled posts for a user
   */
  static getForUser(userId: string): ScheduledPost[] {
    return Array.from(scheduledPosts.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  /**
   * Get all scheduled posts (admin view)
   */
  static getAll(): ScheduledPost[] {
    return Array.from(scheduledPosts.values())
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  /**
   * Get upcoming posts
   */
  static getUpcoming(): ScheduledPost[] {
    const now = Date.now();
    return Array.from(scheduledPosts.values())
      .filter(p => p.status === 'QUEUED' && p.scheduledAt > now)
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  /**
   * Cancel a scheduled post
   */
  static cancel(postId: string, userId: string): boolean {
    const post = scheduledPosts.get(postId);
    if (!post || post.userId !== userId) return false;
    if (post.status !== 'QUEUED') return false;
    post.status = 'CANCELLED';
    scheduledPosts.set(postId, post);
    return true;
  }

  /**
   * Process due posts — called by the scheduler interval
   */
  static async processDuePosts(): Promise<ScheduledPost[]> {
    const now = Date.now();
    const duePosts = Array.from(scheduledPosts.values())
      .filter(p => p.status === 'QUEUED' && p.scheduledAt <= now);
    
    const results: ScheduledPost[] = [];
    
    for (const post of duePosts) {
      post.status = 'PUBLISHING';
      scheduledPosts.set(post.id, post);
      
      try {
        const result = await LinkageService.publish({
          accountId: post.accountId,
          platform: post.platform,
          content: post.content,
          title: post.title,
        });
        
        if (result.success) {
          post.status = 'PUBLISHED';
          post.publishedAt = Date.now();
          post.metadata.postId = result.postId;
          post.metadata.postUrl = result.postUrl;
        } else {
          post.status = 'FAILED';
          post.error = result.error;
        }
      } catch (e) {
        post.status = 'FAILED';
        post.error = String(e);
      }
      
      scheduledPosts.set(post.id, post);
      results.push(post);
    }
    
    return results;
  }

  /**
   * Start the background scheduler (checks every minute)
   */
  static start(): void {
    if (schedulerInterval) return;
    schedulerInterval = setInterval(async () => {
      try {
        await this.processDuePosts();
      } catch (e) {
        console.error('[Scheduler] Error processing posts:', e);
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Stop the background scheduler
   */
  static stop(): void {
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
      schedulerInterval = null;
    }
  }

  /**
   * Get scheduler stats
   */
  static getStats() {
    const all = Array.from(scheduledPosts.values());
    return {
      total: all.length,
      queued: all.filter(p => p.status === 'QUEUED').length,
      published: all.filter(p => p.status === 'PUBLISHED').length,
      failed: all.filter(p => p.status === 'FAILED').length,
      cancelled: all.filter(p => p.status === 'CANCELLED').length,
      nextPublish: all.find(p => p.status === 'QUEUED')?.scheduledAt || null,
    };
  }

  // ==================== HELPERS ====================

  private static findNextSlotTime(slot: OptimalTimeSlot, now: Date): number {
    // Parse time range (e.g., "8:00-10:00 AM" or "10:00 AM")
    const timeMatch = slot.timeRange.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return now.getTime() + 24 * 60 * 60 * 1000;
    
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    
    // Create next occurrence
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    
    // If already past today, move to next valid day
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    
    return next.getTime();
  }
}

// Auto-start scheduler
ContentScheduler.start();
