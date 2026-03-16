import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET: Generate a weekly summary report for the family.
 * Returns per-kid stats for the past 7 days.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const familyId = session.user.familyId;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Get all kids in family
  const kids = await db.user.findMany({
    where: { familyId, role: "CHILD" },
    select: {
      id: true,
      name: true,
      avatarId: true,
      wallet: { select: { availableBalance: true, savedBalance: true, investedBalance: true } },
    },
  });

  const kidReports = await Promise.all(
    kids.map(async (kid) => {
      // Chores completed this week
      const choresCompleted = await db.choreInstance.count({
        where: {
          claimedById: kid.id,
          status: "APPROVED",
          completedAt: { gte: weekAgo },
        },
      });

      // Chores submitted but not yet reviewed
      const choresPending = await db.choreInstance.count({
        where: {
          claimedById: kid.id,
          status: "SUBMITTED",
        },
      });

      // Total earnings this week
      const earningsResult = await db.transaction.aggregate({
        where: {
          wallet: { userId: kid.id },
          type: "EARNING",
          createdAt: { gte: weekAgo },
        },
        _sum: { amount: true },
      });

      // Total saved this week
      const savingsResult = await db.transaction.aggregate({
        where: {
          wallet: { userId: kid.id },
          type: "SAVING",
          createdAt: { gte: weekAgo },
        },
        _sum: { amount: true },
      });

      // Total match received this week
      const matchResult = await db.transaction.aggregate({
        where: {
          wallet: { userId: kid.id },
          type: "MATCH",
          createdAt: { gte: weekAgo },
        },
        _sum: { amount: true },
      });

      // Active investments
      const activeInvestments = await db.investment.count({
        where: { userId: kid.id, status: "ACTIVE" },
      });

      // Achievements unlocked this week
      const newAchievements = await db.userAchievement.findMany({
        where: {
          userId: kid.id,
          unlockedAt: { gte: weekAgo },
        },
        include: { achievement: true },
      });

      // Savings goals progress
      const savingsGoals = await db.savingsGoal.findMany({
        where: { userId: kid.id, isCompleted: false },
        select: { name: true, targetAmount: true, currentAmount: true },
      });

      return {
        id: kid.id,
        name: kid.name,
        avatarId: kid.avatarId,
        wallet: kid.wallet,
        choresCompleted,
        choresPending,
        totalEarned: earningsResult._sum.amount || 0,
        totalSaved: savingsResult._sum.amount || 0,
        totalMatched: matchResult._sum.amount || 0,
        activeInvestments,
        newAchievements: newAchievements.map((ua) => ({
          name: ua.achievement.name,
          emoji: ua.achievement.emoji,
        })),
        savingsGoals,
      };
    })
  );

  // Family totals
  const familyChoresCompleted = kidReports.reduce((sum, k) => sum + k.choresCompleted, 0);
  const familyTotalEarned = kidReports.reduce((sum, k) => sum + k.totalEarned, 0);
  const familyTotalSaved = kidReports.reduce((sum, k) => sum + k.totalSaved, 0);

  return NextResponse.json({
    weekStart: weekAgo.toISOString(),
    weekEnd: new Date().toISOString(),
    familySummary: {
      totalChoresCompleted: familyChoresCompleted,
      totalEarned: familyTotalEarned,
      totalSaved: familyTotalSaved,
    },
    kids: kidReports,
  });
}
