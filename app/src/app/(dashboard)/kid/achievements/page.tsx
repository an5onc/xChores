import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { KidAchievementsContent } from "@/components/kid/kid-achievements-content";

export default async function KidAchievementsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id;

  const [allAchievements, userAchievements] = await Promise.all([
    db.achievement.findMany({ orderBy: { category: "asc" } }),
    db.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true },
    }),
  ]);

  const unlockedMap = new Map(
    userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt]),
  );

  const achievements = allAchievements.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    emoji: a.emoji,
    category: a.category,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id)?.toISOString() ?? null,
  }));

  const totalUnlocked = userAchievements.length;
  const totalAchievements = allAchievements.length;

  return (
    <KidAchievementsContent
      achievements={achievements}
      totalUnlocked={totalUnlocked}
      totalAchievements={totalAchievements}
    />
  );
}
