import { db } from "@/lib/db";

/**
 * Check and update a user's streak after a chore is approved.
 * A streak counts consecutive calendar days where at least one chore was approved.
 * Returns the current streak count and whether a new milestone was hit.
 */
export async function updateStreak(userId: string): Promise<{
  currentStreak: number;
  isNewMilestone: boolean;
  milestoneBonus: number;
}> {
  // Get all approved chore instances for this user, ordered by date
  const approvedInstances = await db.choreInstance.findMany({
    where: {
      claimedById: userId,
      status: "APPROVED",
      completedAt: { not: null },
    },
    select: { completedAt: true },
    orderBy: { completedAt: "desc" },
  });

  if (approvedInstances.length === 0) {
    return { currentStreak: 0, isNewMilestone: false, milestoneBonus: 0 };
  }

  // Calculate streak: count consecutive days with at least one approval
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get unique dates (as YYYY-MM-DD strings)
  const uniqueDates = [
    ...new Set(
      approvedInstances
        .filter((i) => i.completedAt)
        .map((i) => {
          const d = new Date(i.completedAt!);
          d.setHours(0, 0, 0, 0);
          return d.toISOString().split("T")[0];
        })
    ),
  ].sort((a, b) => b.localeCompare(a)); // newest first

  let streak = 0;
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Streak must start from today or yesterday
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return { currentStreak: 0, isNewMilestone: false, milestoneBonus: 0 };
  }

  // Count consecutive days
  const expectedDate = new Date(uniqueDates[0]);
  for (const dateStr of uniqueDates) {
    const expected = expectedDate.toISOString().split("T")[0];
    if (dateStr === expected) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Check milestones: 3, 7, 14, 30, 60, 100 days
  const MILESTONES: Record<number, number> = {
    3: 0.5, // $0.50 bonus
    7: 1.0, // $1.00 bonus
    14: 2.5, // $2.50 bonus
    30: 5.0, // $5.00 bonus
    60: 10.0, // $10.00 bonus
    100: 25.0, // $25.00 bonus
  };

  const isNewMilestone = streak in MILESTONES;
  const milestoneBonus = MILESTONES[streak] || 0;

  return { currentStreak: streak, isNewMilestone, milestoneBonus };
}

/**
 * Award a streak bonus to a user's wallet.
 */
export async function awardStreakBonus(
  userId: string,
  streakDays: number,
  bonus: number
) {
  const wallet = await db.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new Error(`Wallet not found for user ${userId}`);
  }

  await db.$transaction([
    db.wallet.update({
      where: { userId },
      data: { availableBalance: { increment: bonus } },
    }),
    db.transaction.create({
      data: {
        walletId: wallet.id,
        type: "BONUS",
        amount: bonus,
        description: `${streakDays}-day streak bonus!`,
      },
    }),
  ]);
}
