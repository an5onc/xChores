import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateStreak } from "@/lib/streaks";

function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun,1=Mon,...6=Sat
  const diffToMonday = day === 0 ? 6 : day - 1;

  const start = new Date(now);
  start.setDate(now.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  // end is next Monday 00:00:00 (exclusive upper bound)

  return { start, end };
}

function getMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const familyId = session.user.familyId;
  if (!familyId) {
    return NextResponse.json({ error: "No family found." }, { status: 400 });
  }

  // Get all children in the family
  const children = await db.user.findMany({
    where: { familyId, role: "CHILD" },
    select: {
      id: true,
      name: true,
      avatarId: true,
    },
  });

  const week = getWeekBounds();
  const month = getMonthBounds();

  const leaderboard = await Promise.all(
    children.map(async (child) => {
      // Get wallet for this child to query transactions
      const wallet = await db.wallet.findUnique({
        where: { userId: child.id },
        select: { id: true },
      });

      const walletId = wallet?.id;

      // Weekly earnings
      const weeklyEarningsResult = walletId
        ? await db.transaction.aggregate({
            where: {
              walletId,
              type: "EARNING",
              createdAt: { gte: week.start, lt: week.end },
            },
            _sum: { amount: true },
          })
        : { _sum: { amount: null } };

      // Monthly earnings
      const monthlyEarningsResult = walletId
        ? await db.transaction.aggregate({
            where: {
              walletId,
              type: "EARNING",
              createdAt: { gte: month.start, lt: month.end },
            },
            _sum: { amount: true },
          })
        : { _sum: { amount: null } };

      // Weekly chores completed (APPROVED instances)
      const weeklyChoresCompleted = await db.choreInstance.count({
        where: {
          claimedById: child.id,
          status: "APPROVED",
          completedAt: { gte: week.start, lt: week.end },
        },
      });

      // Monthly chores completed
      const monthlyChoresCompleted = await db.choreInstance.count({
        where: {
          claimedById: child.id,
          status: "APPROVED",
          completedAt: { gte: month.start, lt: month.end },
        },
      });

      // Streak (reuse existing logic)
      const streakData = await updateStreak(child.id);

      // Total achievements
      const totalAchievements = await db.userAchievement.count({
        where: { userId: child.id },
      });

      return {
        id: child.id,
        name: child.name,
        avatarId: child.avatarId,
        weeklyEarnings: weeklyEarningsResult._sum.amount ?? 0,
        monthlyEarnings: monthlyEarningsResult._sum.amount ?? 0,
        weeklyChoresCompleted,
        monthlyChoresCompleted,
        currentStreak: streakData.currentStreak,
        totalAchievements,
      };
    })
  );

  // Sort by weekly earnings descending
  leaderboard.sort((a, b) => b.weeklyEarnings - a.weeklyEarnings);

  return NextResponse.json({ leaderboard });
}
