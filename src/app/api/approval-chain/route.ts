import { NextRequest, NextResponse } from "next/server";
import { ApprovalChainService } from "@/lib/approval-chain";
import { AuthService, ROLE_LEVEL_HIERARCHY } from "@/lib/auth";
import { HashChain } from "@/lib/hashchain";
import { ApprovalChainDB } from "@/lib/db-adapter";
import { NotificationService } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    switch (action) {
      case "finalise": {
        // Operator clicks "Finalise" to submit for approval chain
        const {
          transformationId,
          title,
          contentPreview,
          outputTypes,
          metadata,
        } = body;

        if (!transformationId || !title) {
          return NextResponse.json(
            { error: "transformationId and title are required" },
            { status: 400 }
          );
        }

        const user = AuthService.getUser(userId);
        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const request_ = ApprovalChainService.finalise({
          transformationId,
          title,
          contentPreview: contentPreview || "",
          outputTypes: outputTypes || [],
          submittedBy: user.userId,
          submittedByName: user.displayName,
          submittedByLevel: user.roleLevel,
          metadata,
        });

        // Persist to database
        try {
          ApprovalChainDB.save({
            id: request_.id,
            transformationId: request_.transformationId,
            title: request_.title,
            contentPreview: request_.contentPreview,
            outputTypes: request_.outputTypes,
            riskLevel: request_.riskLevel,
            submittedBy: request_.submittedBy,
            submittedByName: request_.submittedByName,
            submittedByLevel: request_.submittedByLevel,
            submittedAt: request_.submittedAt,
            status: request_.status,
            currentStep: request_.currentStep,
            deadline: request_.deadline,
            chain: request_.chain,
          });
        } catch (e) { console.error('[DB] Failed to save approval chain:', e); }

        // Record on hash chain
        HashChain.appendBlock({
          eventType: "SUBMISSION",
          actorId: user.userId,
          actorName: user.displayName,
          sourceContent: `Finalised: ${title}`,
          metadata: {
            requestId: request_.id,
            riskLevel: request_.riskLevel,
            chainLength: request_.chain.length,
            outputTypes,
          },
        });

        // Notify the first approver in the chain
        try {
          const firstStep = request_.chain[0];
          if (firstStep) {
            // Find users at or above the required level
            const allUsers = AuthService.getAllUsers();
            const requiredNum = ROLE_LEVEL_HIERARCHY[firstStep.requiredLevel] || 0;
            const eligibleApprovers = allUsers.filter(u =>
              u.active && u.userId !== user.userId &&
              (ROLE_LEVEL_HIERARCHY[u.roleLevel] || 0) >= requiredNum
            );
            // Notify the first eligible approver
            const approver = eligibleApprovers[0];
            if (approver) {
              await NotificationService.notifyApprovalRequest({
                requestId: request_.id,
                approverId: approver.userId,
                submitterName: user.displayName,
                contentTitle: request_.title,
                riskLevel: request_.riskLevel,
                chainStep: 1,
                totalSteps: request_.chain.length,
                deadline: request_.deadline,
              });
            }
          }
        } catch (e) { console.error('[Notification] Failed to notify approver:', e); }

        return NextResponse.json({ success: true, request: request_ });
      }

      case "approve": {
        // Approver at current chain step makes a decision
        const { requestId, decision, comments } = body;

        if (!requestId || !decision) {
          return NextResponse.json(
            { error: "requestId and decision are required" },
            { status: 400 }
          );
        }

        const user = AuthService.getUser(userId);
        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const result = ApprovalChainService.processApproval({
          requestId,
          approverId: user.userId,
          approverName: user.displayName,
          approverLevel: user.roleLevel,
          decision,
          comments: comments || "",
        });

        // Persist to database
        try {
          ApprovalChainDB.updateStatus(requestId, result.request.status, result.request.currentStep);
          const activeStep = result.request.chain.find((s: any) => s.status === 'ACTIVE');
          if (activeStep) {
            ApprovalChainDB.updateStep(requestId, activeStep.stepNumber, {
              status: 'ACTIVE',
            });
          }
          const completedStep = result.request.chain.find((s: any) => s.status === 'COMPLETED');
          if (completedStep) {
            ApprovalChainDB.updateStep(requestId, completedStep.stepNumber, {
              approverId: completedStep.approverId,
              approverName: completedStep.approverName,
              decision: completedStep.decision,
              decisionAt: completedStep.decisionAt,
              comments: completedStep.comments,
              signatureHash: completedStep.signatureHash,
              status: 'COMPLETED',
            });
          }
        } catch (e) { console.error('[DB] Failed to update approval:', e); }

        // Record on hash chain
        HashChain.appendBlock({
          eventType: decision === "APPROVE" ? "APPROVAL" : "REJECTION",
          actorId: user.userId,
          actorName: user.displayName,
          sourceContent: JSON.stringify({
            requestId,
            decision,
            step: result.request.currentStep,
          }),
          metadata: {
            requestId,
            decision,
            step: result.request.currentStep,
            fullyApproved: result.fullyApproved,
          },
        });

        // Send notifications
        try {
          const req = result.request;
          // Notify submitter of decision
          await NotificationService.notifyDecision({
            requestId,
            submitterId: req.submittedBy,
            contentTitle: req.title,
            decision: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            approverName: user.displayName,
            comments,
          });
          // If chain advanced, notify submitter of progress
          if (result.shouldAdvance && !result.fullyApproved) {
            const nextStep = req.chain.find((s: any) => s.status === 'ACTIVE');
            if (nextStep) {
              await NotificationService.notifyChainAdvanced({
                requestId,
                submitterId: req.submittedBy,
                contentTitle: req.title,
                completedBy: user.displayName,
                nextApproverName: nextStep.requiredRoleName,
                nextStep: nextStep.stepNumber,
                totalSteps: req.chain.length,
              });
            }
          }
          // If fully approved, notify completion
          if (result.fullyApproved) {
            await NotificationService.notifyChainCompleted({
              requestId,
              submitterId: req.submittedBy,
              contentTitle: req.title,
              approvedBy: user.displayName,
              publishResults: [],
            });
          }
        } catch (e) { console.error('[Notification] Failed:', e); }

        return NextResponse.json({
          success: true,
          request: result.request,
          fullyApproved: result.fullyApproved,
        });
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
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "pending";

  switch (action) {
    case "pending": {
      const userId = searchParams.get("userId");
      const userLevel = (searchParams.get("userLevel") || "general_scientist") as any;
      if (userId) {
        return NextResponse.json(
          ApprovalChainService.getPendingForUser(userId, userLevel)
        );
      }
      return NextResponse.json(
        ApprovalChainService.getRequestsByStatus("FINALISED")
      );
    }

    case "my_submissions": {
      const userId = searchParams.get("userId");
      if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
      const all = ApprovalChainService.getAllRequests();
      return NextResponse.json(all.filter((r) => r.submittedBy === userId));
    }

    case "all":
      return NextResponse.json(ApprovalChainService.getAllRequests());

    case "request": {
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const req = ApprovalChainService.getRequest(id);
      if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(req);
    }

    case "history": {
      const requestId = searchParams.get("requestId");
      return NextResponse.json(ApprovalChainService.getHistory(requestId || undefined));
    }

    case "stats":
      return NextResponse.json(ApprovalChainService.getStats());

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
