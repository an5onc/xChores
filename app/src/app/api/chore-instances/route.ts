import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkAchievements } from "@/lib/achievements";

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

      // Check for newly unlocked achievements
      const newAchievements = await checkAchievements(instance.claimedById!);

      return NextResponse.json({ ...updated, newAchievements });
    }

    case "reject": {
      if (role !== "PARENT") {
        return NextResponse.json({ error: "Only parents can reject." }, { status: 403 });
      }
      const updated = await db.choreInstance.update({
        where: { id: instanceId },
        data: { status: "REJECTED", parentNote: parentNote || null },
      });
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
      return NextResponse.json(updated);
    }

    default:
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
}
