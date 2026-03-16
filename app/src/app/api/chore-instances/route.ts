import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkAchievements } from "@/lib/achievements";
import { createNotification, notifyParents } from "@/lib/notifications";
import { updateStreak, awardStreakBonus } from "@/lib/streaks";

// GET: List chore instances for the user
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const familyId = session.user.familyId;
  const role = session.user.role;

  const where =
    role === "CHILD"
      ? {
          chore: { familyId },
          OR: [
            { claimedById: session.user.id },
            { assignedToId: session.user.id },
            { status: "AVAILABLE" as const, assignedToId: null },
          ],
        }
      : { chore: { familyId } };

  const instances = await db.choreInstance.findMany({
    where,
    include: {
      chore: true,
      claimedBy: { select: { id: true, name: true, avatarId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(instances);
}

// PATCH: Update a chore instance (claim, start, submit, approve, reject)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json();
  const { instanceId, action, bonusAmount, parentNote, timeSpentSeconds, proofPhotoUrl } = body;

  if (!instanceId || !action) {
    return NextResponse.json({ error: "instanceId and action required." }, { status: 400 });
  }

  const instance = await db.choreInstance.findUnique({
    where: { id: instanceId },
    include: { chore: true },
  });

  if (!instance) {
    return NextResponse.json({ error: "Instance not found." }, { status: 404 });
  }

  const role = session.user.role;

  switch (action) {
    case "claim": {
      if (instance.status !== "AVAILABLE") {
        return NextResponse.json({ error: "Chore not available." }, { status: 400 });
      }
      const updated = await db.choreInstance.update({
        where: { id: instanceId },
        data: { claimedById: session.user.id, status: "CLAIMED" },
      });
      return NextResponse.json(updated);
    }

    case "start": {
      if (instance.status !== "CLAIMED" || instance.claimedById !== session.user.id) {
        return NextResponse.json({ error: "Cannot start this chore." }, { status: 400 });
      }
      const updated = await db.choreInstance.update({
        where: { id: instanceId },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      });
      return NextResponse.json(updated);
    }

    case "submit": {
      if (instance.claimedById !== session.user.id) {
        return NextResponse.json({ error: "Not your chore." }, { status: 400 });
      }
      const updated = await db.choreInstance.update({
        where: { id: instanceId },
        data: {
          status: "SUBMITTED",
          completedAt: new Date(),
          timeSpentSeconds: timeSpentSeconds || null,
          proofPhotoUrl: proofPhotoUrl || null,
        },
      });

      // Notify parents about the submission
      const claimedUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, familyId: true },
      });
      if (claimedUser?.familyId) {
        await notifyParents(claimedUser.familyId, {
          type: "chore_submitted",
          title: "Chore submitted!",
          message: `${claimedUser.name} submitted ${instance.chore.title}`,
          metadata: { instanceId, choreId: instance.choreId },
        });
      }

      return NextResponse.json(updated);
    }

    case "approve": {
      if (role !== "PARENT") {
        return NextResponse.json({ error: "Only parents can approve." }, { status: 403 });
      }
      if (instance.status !== "SUBMITTED") {
        return NextResponse.json({ error: "Chore not submitted." }, { status: 400 });
      }

      const payout = instance.chore.dollarValue + (bonusAmount || 0);

      // Approve and credit wallet in a transaction
      const [updated] = await db.$transaction([
        db.choreInstance.update({
          where: { id: instanceId },
          data: {
            status: "APPROVED",
            bonusAmount: bonusAmount || null,
            parentNote: parentNote || null,
          },
        }),
        db.wallet.update({
          where: { userId: instance.claimedById! },
          data: { availableBalance: { increment: payout } },
        }),
        db.transaction.create({
          data: {
            wallet: { connect: { userId: instance.claimedById! } },
            type: "EARNING",
            amount: payout,
            description: `Completed: ${instance.chore.title}`,
            choreInstanceId: instanceId,
          },
        }),
      ]);

      // Notify child about approval
      await createNotification({
        userId: instance.claimedById!,
        type: "chore_approved",
        title: "Chore approved!",
        message: `Your chore '${instance.chore.title}' was approved! You earned $${payout.toFixed(2)}`,
        metadata: { instanceId, choreId: instance.choreId, payout },
      });

      // Check for newly unlocked achievements
      const newAchievements = await checkAchievements(instance.claimedById!);

      // Check and update streak
      const streak = await updateStreak(instance.claimedById!);
      if (streak.isNewMilestone && streak.milestoneBonus > 0) {
        await awardStreakBonus(instance.claimedById!, streak.currentStreak, streak.milestoneBonus);
        await createNotification({
          userId: instance.claimedById!,
          type: "streak",
          title: `🔥 ${streak.currentStreak}-day streak!`,
          message: `You've been doing chores ${streak.currentStreak} days in a row! Bonus: $${streak.milestoneBonus.toFixed(2)}`,
          metadata: { streak: streak.currentStreak, bonus: streak.milestoneBonus },
        });
      }

      return NextResponse.json({ ...updated, newAchievements, streak });
    }

    case "reject": {
      if (role !== "PARENT") {
        return NextResponse.json({ error: "Only parents can reject." }, { status: 403 });
      }
      const updated = await db.choreInstance.update({
        where: { id: instanceId },
        data: { status: "REJECTED", parentNote: parentNote || null },
      });

      // Notify child about rejection
      if (instance.claimedById) {
        await createNotification({
          userId: instance.claimedById,
          type: "chore_rejected",
          title: "Chore not approved",
          message: `Your chore '${instance.chore.title}' was not approved.${parentNote ? ` Note: ${parentNote}` : ""}`,
          metadata: { instanceId, choreId: instance.choreId },
        });
      }

      return NextResponse.json(updated);
    }

    case "redo": {
      if (role !== "PARENT") {
        return NextResponse.json({ error: "Only parents can request redo." }, { status: 403 });
      }
      const updated = await db.choreInstance.update({
        where: { id: instanceId },
        data: { status: "REDO", parentNote: parentNote || null },
      });

      // Notify child about redo request
      if (instance.claimedById) {
        await createNotification({
          userId: instance.claimedById,
          type: "chore_redo",
          title: "Redo requested",
          message: `Please redo your chore '${instance.chore.title}'.${parentNote ? ` Note: ${parentNote}` : ""}`,
          metadata: { instanceId, choreId: instance.choreId },
        });
      }

      return NextResponse.json(updated);
    }

    default:
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
}
