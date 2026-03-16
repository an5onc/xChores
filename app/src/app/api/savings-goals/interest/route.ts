import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

/**
 * POST: Process weekly interest on all active savings goals for the family.
 * Interest rate comes from FamilySettings.savingsInterestRate (default 2%).
 * Parent-only.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const familyId = session.user.familyId;

  // Get family settings for interest rate
  const settings = await db.familySettings.findUnique({
    where: { familyId },
  });

  const rate = settings?.savingsInterestRate ?? 0.02; // default 2% weekly

  if (rate <= 0) {
    return NextResponse.json({ processed: 0, message: "Interest rate is 0." });
  }

  // Find all active (incomplete) savings goals for kids in this family
  const goals = await db.savingsGoal.findMany({
    where: {
      user: { familyId, role: "CHILD" },
      isCompleted: false,
      currentAmount: { gt: 0 },
    },
    include: { user: { select: { id: true, name: true } } },
  });

  const results: { userId: string; goalName: string; interest: number }[] = [];

  for (const goal of goals) {
    const interest = parseFloat((goal.currentAmount * rate).toFixed(2));
    if (interest <= 0) continue;

    await db.$transaction([
      db.savingsGoal.update({
        where: { id: goal.id },
        data: { currentAmount: { increment: interest } },
      }),
      db.wallet.update({
        where: { userId: goal.userId },
        data: { savedBalance: { increment: interest } },
      }),
      db.transaction.create({
        data: {
          wallet: { connect: { userId: goal.userId } },
          type: "MATCH",
          amount: interest,
          description: `Savings interest (${(rate * 100).toFixed(1)}%) on "${goal.name}"`,
          savingsGoal: { connect: { id: goal.id } },
        },
      }),
    ]);

    // Check if goal is now complete
    const updatedGoal = await db.savingsGoal.findUnique({ where: { id: goal.id } });
    if (updatedGoal && updatedGoal.currentAmount >= updatedGoal.targetAmount) {
      await db.savingsGoal.update({
        where: { id: goal.id },
        data: { isCompleted: true },
      });
      await createNotification({
        userId: goal.userId,
        type: "savings_match",
        title: "Savings goal reached!",
        message: `Your savings goal "${goal.name}" is complete! 🎉`,
      });
    }

    await createNotification({
      userId: goal.userId,
      type: "savings_match",
      title: "Interest earned!",
      message: `Your savings for "${goal.name}" earned $${interest.toFixed(2)} in interest!`,
    });

    results.push({ userId: goal.userId, goalName: goal.name, interest });
  }

  return NextResponse.json({
    processed: results.length,
    rate: `${(rate * 100).toFixed(1)}%`,
    results,
  });
}
