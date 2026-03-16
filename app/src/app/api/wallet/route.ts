import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Get wallet balance and recent transactions
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const wallet = await db.wallet.findUnique({
    where: { userId: session.user.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found." }, { status: 404 });
  }

  return NextResponse.json(wallet);
}

// POST: Allocate funds (save/spend/invest decision)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { spendAmount, saveAmount, investAmount, savingsGoalId, lockDays } =
    await req.json();

  const total =
    (spendAmount || 0) + (saveAmount || 0) + (investAmount || 0);

  const wallet = await db.wallet.findUnique({
    where: { userId: session.user.id },
  });

  if (!wallet || wallet.availableBalance < total) {
    return NextResponse.json(
      { error: "Insufficient balance." },
      { status: 400 }
    );
  }

  const operations: any[] = [];

  // Deduct from available
  operations.push(
    db.wallet.update({
      where: { userId: session.user.id },
      data: { availableBalance: { decrement: total } },
    })
  );

  // Save allocation
  if (saveAmount > 0 && savingsGoalId) {
    const goal = await db.savingsGoal.findUnique({
      where: { id: savingsGoalId },
    });

    operations.push(
      db.wallet.update({
        where: { userId: session.user.id },
        data: { savedBalance: { increment: saveAmount } },
      })
    );
    operations.push(
      db.savingsGoal.update({
        where: { id: savingsGoalId },
        data: { currentAmount: { increment: saveAmount } },
      })
    );
    operations.push(
      db.transaction.create({
        data: {
          walletId: wallet.id,
          type: "SAVING",
          amount: saveAmount,
          description: "Saved toward goal",
          savingsGoalId,
        },
      })
    );

    // Parent match: auto-credit matched funds
    if (goal?.parentMatchRate && goal.parentMatchRate > 0) {
      const matchAmount = parseFloat((saveAmount * goal.parentMatchRate).toFixed(2));
      if (matchAmount > 0) {
        operations.push(
          db.wallet.update({
            where: { userId: session.user.id },
            data: { savedBalance: { increment: matchAmount } },
          })
        );
        operations.push(
          db.savingsGoal.update({
            where: { id: savingsGoalId },
            data: { currentAmount: { increment: matchAmount } },
          })
        );
        operations.push(
          db.transaction.create({
            data: {
              walletId: wallet.id,
              type: "MATCH",
              amount: matchAmount,
              description: `Parent match (${goal.parentMatchRate}x) on savings`,
              savingsGoalId,
            },
          })
        );
      }
    }

    // Check if goal is now completed
    if (goal) {
      const newTotal = goal.currentAmount + saveAmount + (goal.parentMatchRate ? saveAmount * goal.parentMatchRate : 0);
      if (newTotal >= goal.targetAmount && !goal.isCompleted) {
        operations.push(
          db.savingsGoal.update({
            where: { id: savingsGoalId },
            data: { isCompleted: true },
          })
        );
      }
    }
  }

  // Invest allocation
  if (investAmount > 0) {
    const days = lockDays || 7;
    const maturationDate = new Date();
    maturationDate.setDate(maturationDate.getDate() + days);

    operations.push(
      db.wallet.update({
        where: { userId: session.user.id },
        data: { investedBalance: { increment: investAmount } },
      })
    );
    operations.push(
      db.investment.create({
        data: {
          userId: session.user.id,
          principalAmount: investAmount,
          lockDays: days,
          maturationDate,
        },
      })
    );
    operations.push(
      db.transaction.create({
        data: {
          walletId: wallet.id,
          type: "INVESTMENT",
          amount: investAmount,
          description: `Invested for ${days} days`,
        },
      })
    );
  }

  // Spend stays in available (already deducted, record transaction)
  if (spendAmount > 0) {
    // Re-add spend to available since it's "spending money" (stays accessible)
    operations.push(
      db.wallet.update({
        where: { userId: session.user.id },
        data: { availableBalance: { increment: spendAmount } },
      })
    );
  }

  await db.$transaction(operations);

  const updated = await db.wallet.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(updated);
}
