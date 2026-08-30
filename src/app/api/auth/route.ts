import { NextRequest, NextResponse } from "next/server";
import { AuthService, PORTAL_CONFIG, PortalRole } from "@/lib/auth";
import { generateQRCodeSVG } from "@/lib/qr-code";
import { getTOTPRemaining } from "@/lib/totp";
import { initDatabase, persistAuthUser, getDBStats } from "@/lib/db-init";

// Initialize DB on first request
let dbReady = false;
async function ensureDB() {
  if (!dbReady) {
    await initDatabase();
    dbReady = true;
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDB();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "login": {
        const { username, password, portal, googleEmail } = body;
        if (!username || !password || !portal) {
          return NextResponse.json({ error: "Username, password, and portal are required" }, { status: 400 });
        }

        const result = AuthService.login(username, password, portal as PortalRole, request.headers.get('x-forwarded-for') || '127.0.0.1');

        if (result.mfaRequired) {
          return NextResponse.json({ mfaRequired: true, challengeId: result.challengeId });
        }

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 401 });
        }

        // Link Google identity to the org credential user
        if (result.user && googleEmail) {
          result.user.googleEmail = googleEmail;
          result.user.authProvider = 'both';
        }

        // Persist login to DB
        if (result.user) persistAuthUser(result.user);

        return NextResponse.json({
          success: true,
          session: result.session,
          user: result.user,
        });
      }

      case "verify_mfa": {
        const { challengeId, code } = body;
        if (!challengeId || !code) {
          return NextResponse.json({ error: "Challenge ID and code are required" }, { status: 400 });
        }

        const result = AuthService.verifyMFA(challengeId, code);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 401 });
        }

        return NextResponse.json({
          success: true,
          session: result.session,
          user: result.user,
        });
      }

      case "logout": {
        const { token } = body;
        if (token) AuthService.logout(token);
        return NextResponse.json({ success: true });
      }

      case "enable_mfa": {
        const { userId } = body;
        const success = AuthService.enableMFA(userId);
        return NextResponse.json({ success });
      }

      case "start_mfa_enrollment": {
        const { userId } = body;
        if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
        const enrollment = AuthService.startMFAEnrollment(userId);
        if (!enrollment) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Generate QR code SVG
        const user = AuthService.getUser(userId);
        const qrCodeSVG = generateQRCodeSVG(enrollment.otpauthUri, { moduleSize: 8, margin: 4 });

        return NextResponse.json({
          success: true,
          enrollmentId: enrollment.enrollmentId,
          secret: enrollment.secret,
          otpauthUri: enrollment.otpauthUri,
          qrCodeSVG,
          recoveryCodes: enrollment.recoveryCodes,
          accountName: user?.username || userId,
          issuer: 'NTRO GenAI Platform',
          expiresIn: 900, // 15 minutes
        });
      }

      case "verify_mfa_enrollment": {
        const { enrollmentId, code } = body;
        if (!enrollmentId || !code) return NextResponse.json({ error: "enrollmentId and code required" }, { status: 400 });
        const result = AuthService.verifyMFAEnrollment(enrollmentId, code);
        if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
        return NextResponse.json({ success: true, recoveryCodes: result.recoveryCodes });
      }

      case "disable_mfa": {
        const { userId } = body;
        const success = AuthService.disableMFA(userId);
        return NextResponse.json({ success });
      }

      case "update_role": {
        const { userId, role, roleLevel } = body;
        if (!userId || !role) return NextResponse.json({ error: "userId and role required" }, { status: 400 });
        const success = AuthService.updateUserRole(userId, role, roleLevel || 'general_scientist');
        return NextResponse.json({ success });
      }

      case "create_user": {
        const { username, displayName, role } = body;
        if (!username || !displayName || !role) {
          return NextResponse.json({ error: "Username, displayName, and role are required" }, { status: 400 });
        }
        const user = AuthService.createUser(username, displayName, role as PortalRole);
        if (!user) {
          return NextResponse.json({ error: "Username already exists" }, { status: 409 });
        }
        persistAuthUser(user);
        return NextResponse.json({ success: true, user });
      }

      case "deactivate": {
        const { userId } = body;
        const success = AuthService.deactivateUser(userId);
        return NextResponse.json({ success });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  await ensureDB();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "portals";

  switch (action) {
    case "portals":
      return NextResponse.json(PORTAL_CONFIG);

    case "db_stats":
      return NextResponse.json(getDBStats());

    case "users":
      return NextResponse.json(AuthService.getAllUsers().map(u => ({
        ...u,
        // Don't expose private key
        publicKey: u.publicKey,
      })));

    case "validate": {
      const token = searchParams.get("token");
      if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });
      const result = AuthService.validateSession(token);
      return NextResponse.json(result);
    }

    case "login_history":
      return NextResponse.json(AuthService.getLoginHistory());

    case "totp_remaining":
      return NextResponse.json({ remaining: getTOTPRemaining(), period: 30 });

    case "public_key": {
      const userId = searchParams.get("userId");
      if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
      const key = AuthService.getPublicKey(userId);
      if (!key) return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json({ publicKey: key });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
