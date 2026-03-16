import { db } from "@/lib/db";

/** Achievement definitions seeded into the DB */
export const ACHIEVEMENT_DEFS = [
  // Chore milestones
  { key: "first_chore", name: "First Steps", description: "Complete your first chore", emoji: "🌟", category: "chores", threshold: 1 },
  { key: "chores_5", name: "Getting Started", description: "Complete 5 chores", emoji: "💪", category: "chores", threshold: 5 },
  { key: "chores_10", name: "Hard Worker", description: "Complete 10 chores", emoji: "🔥", category: "chores", threshold: 10 },
  { key: "chores_25", name: "Chore Champion", description: "Complete 25 chores", emoji: "🏆", category: "chores", threshold: 25 },
  { key: "chores_50", name: "Unstoppable", description: "Complete 50 chores", emoji: "⚡", category: "chores", threshold: 50 },

  // Savings milestones
  { key: "first_save", name: "Piggy Bank", description: "Save money for the first time", emoji: "🐷", category: "savings", threshold: 1 },
  { key: "goal_reached", name: "Goal Getter", description: "Reach a savings goal", emoji: "🎯", category: "savings", threshold: 1 },
  { key: "goals_3", name: "Dream Big", description: "Reach 3 savings goals", emoji: "🌈", category: "savings", threshold: 3 },

  // Investment milestones
  { key: "first_invest", name: "Baby Investor", description: "Make your first investment", emoji: "🌱", category: "investing", threshold: 1 },
  { key: "invest_matured", name: "Patient Saver", description: "Wait for an investment to mature", emoji: "🌳", category: "investing", threshold: 1 },
  { key: "invest_3", name: "Portfolio Builder", description: "Make 3 investments", emoji: "📈", category: "investing", threshold: 3 },

  // Earning milestones
  { key: "earned_10", name: "First Tenner", description: "Earn $10 total", emoji: "💵", category: "chores", threshold: 10 },
  { key: "earned_50", name: "Money Maker", description: "Earn $50 total", emoji: "💰", category: "chores", threshold: 50 },
  { key: "earned_100", name: "Hundred Club", description: "Earn $100 total", emoji: "🤑", category: "chores", threshold: 100 },

  // Bonus
  { key: "first_bonus", name: "Above & Beyond", description: "Earn your first bonus", emoji: "⭐", category: "chores", threshold: 1 },
];

/**
 * Check and unlock achievements for a user.
 * Returns newly unlocked achievement names (empty array if none).
 */
export async function checkAchievements(userId: string): Promise<{ name: string; emoji: string }[]> {
  // Get all achievements not yet unlocked by this user
  const allAchievements = await db.achievement.findMany();
  const unlocked = await db.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));
  const pending = allAchievements.filter((a) => !unlockedIds.has(a.id));

  if (pending.length === 0) return [];

  // Gather user stats
  const [choreCount, savingsGoalCount, investmentCount, earningTotal, bonusCount, maturedCount, saveTxCount] =
    await Promise.all([
      db.choreInstance.count({
        where: { claimedById: userId, status: "APPROVED" },
      }),
      db.savingsGoal.count({
        where: { userId, isCompleted: true },
      }),
      db.investment.count({
        where: { userId },
      }),
      db.transaction.aggregate({
        where: { wallet: { userId }, type: "EARNING" },
        _sum: { amount: true },
      }),
      db.choreInstance.count({
        where: { claimedById: userId, status: "APPROVED", bonusAmount: { gt: 0 } },
      }),
      db.investment.count({
        where: { userId, status: "MATURED" },
      }),
      db.transaction.count({
        where: { wallet: { userId }, type: "SAVING" },
      }),
    ]);

  const totalEarned = earningTotal._sum.amount ?? 0;

  // Map achievement keys to their stat values
  const statMap: Record<string, number> = {
    first_chore: choreCount,
    chores_5: choreCount,
    chores_10: choreCount,
    chores_25: choreCount,
    chores_50: choreCount,
    first_save: saveTxCount,
    goal_reached: savingsGoalCount,
    goals_3: savingsGoalCount,
    first_invest: investmentCount,
    invest_matured: maturedCount,
    invest_3: investmentCount,
    earned_10: totalEarned,
    earned_50: totalEarned,
    earned_100: totalEarned,
    first_bonus: bonusCount,
  };

  // Check which achievements are newly earned
  const newlyUnlocked: { name: string; emoji: string }[] = [];

  for (const achievement of pending) {
    const stat = statMap[achievement.key];
    if (stat !== undefined && stat >= achievement.threshold) {
      await db.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });
      newlyUnlocked.push({ name: achievement.name, emoji: achievement.emoji });
    }
  }

  return newlyUnlocked;
}

/**
 * Seed achievement definitions into the database (idempotent).
 */
export async function seedAchievements() {
  for (const def of ACHIEVEMENT_DEFS) {
    await db.achievement.upsert({
      where: { key: def.key },
      update: { name: def.name, description: def.description, emoji: def.emoji, category: def.category, threshold: def.threshold },
      create: def,
    });
  }
}
