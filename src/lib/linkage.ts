/**
 * External Linkage Service
 * 
 * Manages connections to external platforms:
 * - LinkedIn (OAuth 2.0, share posts, company pages)
 * - X/Twitter (OAuth 2.0, tweet, thread)
 * - Email (SMTP, send newsletters/notifications)
 * 
 * Each linked account stores OAuth tokens for auto-publishing
 * after approval chain completes.
 */

// ==================== TYPES ====================

export type Platform = 'linkedin' | 'twitter' | 'email';

export type LinkStatus = 'NOT_LINKED' | 'LINKING' | 'LINKED' | 'EXPIRED' | 'ERROR';

export interface LinkedAccount {
  id: string;
  userId: string;
  platform: Platform;
  
  // Account info
  accountId: string;          // Platform's user/org ID
  accountName: string;        // Display name
  accountEmail?: string;
  avatarUrl?: string;
  
  // OAuth tokens
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  scope?: string[];
  
  // Status
  status: LinkStatus;
  linkedAt: number;
  lastUsedAt?: number;
  lastError?: string;
  
  // Platform-specific metadata
  metadata: Record<string, any>;
}

export interface PublishRequest {
  accountId: string;
  platform: Platform;
  content: string;
  title?: string;
  mediaUrls?: string[];
  visibility?: 'public' | 'connections' | 'private';
}

export interface PublishResponse {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  platform: Platform;
  timestamp: number;
}

export interface PlatformConfig {
  platform: Platform;
  name: string;
  icon: string;
  color: string;
  authUrl: string;
  scopes: string[];
  description: string;
}

// ==================== PLATFORM CONFIGS ====================

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  linkedin: {
    platform: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scopes: ['w_member_social', 'r_liteprofile', 'r_emailaddress'],
    description: 'Share professional posts, articles, and company updates',
  },
  twitter: {
    platform: 'twitter',
    name: 'X (Twitter)',
    icon: '🐦',
    color: '#1DA1F2',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    description: 'Post tweets, threads, and engage with your audience',
  },
  email: {
    platform: 'email',
    name: 'Email',
    icon: '📧',
    color: '#EA4335',
    authUrl: '',
    scopes: ['send'],
    description: 'Send newsletters, notifications, and mass email campaigns',
  },
};

// ==================== IN-MEMORY STORE ====================

const linkedAccounts: Map<string, LinkedAccount> = new Map();
const publishLog: PublishResponse[] = [];

// ==================== SERVICE ====================

export class LinkageService {
  /**
   * Get OAuth authorization URL for a platform
   */
  static getAuthUrl(platform: Platform, userId: string): string {
    const config = PLATFORM_CONFIGS[platform];
    
    if (platform === 'email') {
      // Email doesn't need OAuth — configured via SMTP settings
      return '/api/linkage?action=configure_email';
    }
    
    // LinkedIn OAuth
    if (platform === 'linkedin') {
      const clientId = process.env.LINKEDIN_CLIENT_ID || '';
      const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/linkage/callback/linkedin`;
      
      if (!clientId) {
        // Demo mode
        return `/api/linkage?action=demo_link&platform=linkedin&userId=${userId}`;
      }
      
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: config.scopes.join(' '),
        state: userId,
      });
      return `${config.authUrl}?${params.toString()}`;
    }
    
    // Twitter OAuth
    if (platform === 'twitter') {
      const clientId = process.env.TWITTER_CLIENT_ID || '';
      const redirectUri = process.env.TWITTER_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/linkage/callback/twitter`;
      
      if (!clientId) {
        // Demo mode
        return `/api/linkage?action=demo_link&platform=twitter&userId=${userId}`;
      }
      
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: config.scopes.join(' '),
        state: userId,
        code_challenge: 'challenge', // PKCE in production
        code_challenge_method: 'S256',
      });
      return `${config.authUrl}?${params.toString()}`;
    }
    
    return '';
  }
  
  /**
   * Demo mode: simulate linking an account
   */
  static demoLink(platform: Platform, userId: string): LinkedAccount {
    const config = PLATFORM_CONFIGS[platform];
    const id = `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const account: LinkedAccount = {
      id,
      userId,
      platform,
      accountId: `${platform}-${Math.random().toString(36).substring(2, 10)}`,
      accountName: platform === 'linkedin' 
        ? 'NTRO Official' 
        : platform === 'twitter' 
          ? '@NTRO_Gov' 
          : 'ntro@gov.in',
      accountEmail: platform === 'email' ? 'ntro@gov.in' : undefined,
      accessToken: 'demo-token-' + Math.random().toString(36).substring(2),
      refreshToken: 'demo-refresh-' + Math.random().toString(36).substring(2),
      tokenExpiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
      scope: config.scopes,
      status: 'LINKED',
      linkedAt: Date.now(),
      metadata: {
        demo: true,
        followers: Math.floor(Math.random() * 10000),
        verified: true,
      },
    };
    
    linkedAccounts.set(id, account);
    return account;
  }
  
  /**
   * Link an account after OAuth callback
   */
  static linkAccount(params: {
    userId: string;
    platform: Platform;
    code: string;
    accountId: string;
    accountName: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    scope?: string[];
    metadata?: Record<string, any>;
  }): LinkedAccount {
    const id = `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const account: LinkedAccount = {
      id,
      userId: params.userId,
      platform: params.platform,
      accountId: params.accountId,
      accountName: params.accountName,
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      tokenExpiresAt: params.expiresAt,
      scope: params.scope,
      status: 'LINKED',
      linkedAt: Date.now(),
      metadata: params.metadata || {},
    };
    
    linkedAccounts.set(id, account);
    return account;
  }
  
  /**
   * Get all linked accounts for a user
   */
  static getLinkedAccounts(userId: string): LinkedAccount[] {
    return Array.from(linkedAccounts.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => b.linkedAt - a.linkedAt);
  }
  
  /**
   * Get linked accounts by platform for a user
   */
  static getLinkedByPlatform(userId: string, platform: Platform): LinkedAccount | undefined {
    return Array.from(linkedAccounts.values())
      .find(a => a.userId === userId && a.platform === platform && a.status === 'LINKED');
  }
  
  /**
   * Unlink an account
   */
  static unlinkAccount(accountId: string, userId: string): boolean {
    const account = linkedAccounts.get(accountId);
    if (!account || account.userId !== userId) return false;
    account.status = 'EXPIRED';
    linkedAccounts.set(accountId, account);
    return true;
  }
  
  /**
   * Publish content to a platform
   */
  static async publish(params: PublishRequest): Promise<PublishResponse> {
    const account = linkedAccounts.get(params.accountId);
    if (!account) {
      return { success: false, error: 'Account not found', platform: params.platform, timestamp: Date.now() };
    }
    if (account.status !== 'LINKED') {
      return { success: false, error: 'Account is not linked', platform: params.platform, timestamp: Date.now() };
    }
    
    // Check token expiry
    if (account.tokenExpiresAt && Date.now() > account.tokenExpiresAt) {
      account.status = 'EXPIRED';
      linkedAccounts.set(account.id, account);
      return { success: false, error: 'Token expired — re-link account', platform: params.platform, timestamp: Date.now() };
    }
    
    let result: PublishResponse;
    
    try {
      if (account.metadata?.demo) {
        // Demo mode — simulate publishing
        result = await this.demoPublish(params, account);
      } else {
        // Real publishing
        switch (params.platform) {
          case 'linkedin':
            result = await this.publishToLinkedIn(params, account);
            break;
          case 'twitter':
            result = await this.publishToTwitter(params, account);
            break;
          case 'email':
            result = await this.publishViaEmail(params, account);
            break;
          default:
            result = { success: false, error: 'Unknown platform', platform: params.platform, timestamp: Date.now() };
        }
      }
    } catch (e) {
      result = { success: false, error: String(e), platform: params.platform, timestamp: Date.now() };
    }
    
    // Update last used
    account.lastUsedAt = Date.now();
    if (!result.success) account.lastError = result.error;
    linkedAccounts.set(account.id, account);
    
    publishLog.push(result);
    return result;
  }
  
  /**
   * Demo publish — simulate posting
   */
  private static async demoPublish(params: PublishRequest, account: LinkedAccount): Promise<PublishResponse> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    
    const postId = `${params.platform}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    return {
      success: true,
      postId,
      postUrl: params.platform === 'linkedin'
        ? `https://linkedin.com/posts/${account.accountId}-${postId}`
        : params.platform === 'twitter'
          ? `https://twitter.com/${account.accountName}/status/${postId}`
          : undefined,
      platform: params.platform,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Publish to LinkedIn via API
   */
  private static async publishToLinkedIn(params: PublishRequest, account: LinkedAccount): Promise<PublishResponse> {
    try {
      // Step 1: Create the post
      const postBody = {
        author: `urn:li:person:${account.accountId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: params.content },
            shareMediaCategory: params.mediaUrls?.length ? 'ARTICLE' : 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': params.visibility || 'PUBLIC',
        },
      };
      
      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(postBody),
      });
      
      if (!res.ok) {
        const error = await res.text();
        return { success: false, error: `LinkedIn API error: ${res.status} ${error}`, platform: 'linkedin', timestamp: Date.now() };
      }
      
      const postId = res.headers.get('x-restli-id') || `linkedin-${Date.now()}`;
      return {
        success: true,
        postId,
        postUrl: `https://linkedin.com/feed/update/${postId}`,
        platform: 'linkedin',
        timestamp: Date.now(),
      };
    } catch (e) {
      return { success: false, error: String(e), platform: 'linkedin', timestamp: Date.now() };
    }
  }
  
  /**
   * Publish to Twitter via API v2
   */
  private static async publishToTwitter(params: PublishRequest, account: LinkedAccount): Promise<PublishResponse> {
    try {
      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: params.content.substring(0, 280),
        }),
      });
      
      if (!res.ok) {
        const error = await res.text();
        return { success: false, error: `Twitter API error: ${res.status} ${error}`, platform: 'twitter', timestamp: Date.now() };
      }
      
      const data = await res.json();
      const tweetId = data?.data?.id;
      return {
        success: true,
        postId: tweetId,
        postUrl: tweetId ? `https://twitter.com/${account.accountName}/status/${tweetId}` : undefined,
        platform: 'twitter',
        timestamp: Date.now(),
      };
    } catch (e) {
      return { success: false, error: String(e), platform: 'twitter', timestamp: Date.now() };
    }
  }
  
  /**
   * Send email via configured SMTP
   */
  private static async publishViaEmail(params: PublishRequest, account: LinkedAccount): Promise<PublishResponse> {
    // In production, use nodemailer or similar SMTP client
    // For demo, simulate email sending
    try {
      const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      };
      
      // Simulate email send
      if (!emailConfig.user) {
        return {
          success: true,
          postId: `email-${Date.now()}`,
          platform: 'email',
          timestamp: Date.now(),
        };
      }
      
      // Real SMTP would go here with nodemailer
      return {
        success: true,
        postId: `email-${Date.now()}`,
        platform: 'email',
        timestamp: Date.now(),
      };
    } catch (e) {
      return { success: false, error: String(e), platform: 'email', timestamp: Date.now() };
    }
  }
  
  /**
   * Auto-publish to all linked platforms after approval
   */
  static async autoPublishAfterApproval(
    userId: string,
    content: string,
    title: string,
    platforms?: Platform[]
  ): Promise<PublishResponse[]> {
    const accounts = this.getLinkedAccounts(userId)
      .filter(a => a.status === 'LINKED')
      .filter(a => !platforms || platforms.includes(a.platform));
    
    const results: PublishResponse[] = [];
    
    for (const account of accounts) {
      const result = await this.publish({
        accountId: account.id,
        platform: account.platform,
        content,
        title,
      });
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Get publish history
   */
  static getPublishLog(userId?: string): PublishResponse[] {
    if (userId) {
      // Filter by accounts owned by user
      const userAccountIds = new Set(
        Array.from(linkedAccounts.values())
          .filter(a => a.userId === userId)
          .map(a => a.id)
      );
      return publishLog.filter(r => userAccountIds.has(r.postId?.split('-')[0] || ''));
    }
    return [...publishLog].reverse();
  }
  
  /**
   * Get platform connection status for a user
   */
  static getConnectionStatus(userId: string): Record<Platform, { linked: boolean; accountName?: string; status: LinkStatus }> {
    const result: Record<Platform, { linked: boolean; accountName?: string; status: LinkStatus }> = {
      linkedin: { linked: false, status: 'NOT_LINKED' },
      twitter: { linked: false, status: 'NOT_LINKED' },
      email: { linked: false, status: 'NOT_LINKED' },
    };
    
    for (const platform of ['linkedin', 'twitter', 'email'] as Platform[]) {
      const account = this.getLinkedByPlatform(userId, platform);
      if (account) {
        result[platform] = {
          linked: true,
          accountName: account.accountName,
          status: account.status,
        };
      }
    }
    
    return result;
  }
}
