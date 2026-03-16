import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkAchievements, seedAchievements } from "@/lib/achievements";

// GET: List user's achievements (unlocked + locked)
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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
    key: a.key,
    name: a.name,
    description: a.description,
    emoji: a.emoji,
    category: a.category,
    threshold: a.threshold,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id) ?? null,
  }));

  return NextResponse.json(achievements);
}

// POST: Seed achievements (admin/parent only) or check for new ones
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role === "PARENT") {
    // Seed achievement definitions
    await seedAchievements();
    return NextResponse.json({ message: "Achievements seeded." });
  }

  // For kids: check and unlock new achievements
  const newlyUnlocked = await checkAchievements(session.user.id);
  return NextResponse.json({ newlyUnlocked });
}
