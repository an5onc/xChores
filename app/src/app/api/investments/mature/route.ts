import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST: Auto-mature all investments that have passed their maturation date.
 * Parent-only. Applies a simple interest rate based on lock period:
 *   7 days  → 5% return
 *   14 days → 12% return
 *   30 days → 25% return
 */

const RETURN_RATES: Record<number, number> = {
  7: 0.05,
  14: 0.12,
  30: 0.25,
};

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const familyId = session.user.familyId;

  // Find all matured-but-still-active investments for this family
  const readyInvestments = await db.investment.findMany({
    where: {
      user: { familyId },
      status: "ACTIVE",
      maturationDate: { lte: new Date() },
    },
    include: { user: { select: { id: true, name: true } } },
  });

  if (readyInvestments.length === 0) {
    return NextResponse.json({ matured: 0, message: "No investments ready to mature." });
  }

  const results: { userId: string; userName: string; principal: number; payout: number }[] = [];

  for (const inv of readyInvestments) {
    const rate = RETURN_RATES[inv.lockDays] ?? 0.05;
    const payout = parseFloat((inv.principalAmount * (1 + rate)).toFixed(2));

    await db.$transaction([
      db.investment.update({
        where: { id: inv.id },
        data: {
          status: "MATURED",
          returnAmount: payout,
          maturedAt: new Date(),
        },
      }),
      db.wallet.update({
        where: { userId: inv.userId },
        data: {
          investedBalance: { decrement: inv.principalAmount },
          availableBalance: { increment: payout },
        },
      }),
      db.transaction.create({
        data: {
          wallet: { connect: { userId: inv.userId } },
          type: "MATURATION",
          amount: payout,
          description: `Investment matured! Invested $${inv.principalAmount.toFixed(2)} for ${inv.lockDays} days → earned $${payout.toFixed(2)}`,
          investment: { connect: { id: inv.id } },
        },
      }),
    ]);

    results.push({
      userId: inv.userId,
      userName: inv.user.name,
      principal: inv.principalAmount,
      payout,
    });
  }

  return NextResponse.json({
    matured: results.length,
    results,
  });
}

/**
 * GET: Check for investments that are ready to mature (preview, no action).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const familyId = session.user.familyId;

  const ready = await db.investment.findMany({
    where: {
      user: { familyId },
      status: "ACTIVE",
      maturationDate: { lte: new Date() },
    },
    include: { user: { select: { id: true, name: true, avatarId: true } } },
  });

  const upcoming = await db.investment.findMany({
    where: {
      user: { familyId },
      status: "ACTIVE",
      maturationDate: { gt: new Date() },
    },
    include: { user: { select: { id: true, name: true, avatarId: true } } },
    orderBy: { maturationDate: "asc" },
    take: 10,
  });

  return NextResponse.json({ ready, upcoming });
}
