"use client";

import { FadeIn, StaggerContainer, StaggerItem, ScaleIn } from "@/components/shared/animations";

interface AchievementData {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

interface KidAchievementsContentProps {
  achievements: AchievementData[];
  totalUnlocked: number;
  totalAchievements: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  chores: "Chores",
  savings: "Savings",
  investing: "Investing",
};

export function KidAchievementsContent({
  achievements,
  totalUnlocked,
  totalAchievements,
}: KidAchievementsContentProps) {
  // Group by category
  const categories = [...new Set(achievements.map((a) => a.category))];

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold text-gray-900">My Achievements</h1>
      </FadeIn>

      {/* Progress summary */}
      <FadeIn delay={0.1}>
        <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white shadow-lg">
          <p className="text-sm font-medium opacity-80">Unlocked</p>
          <p className="mt-1 text-4xl font-bold">
            {totalUnlocked} / {totalAchievements}
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{
                width: `${totalAchievements > 0 ? (totalUnlocked / totalAchievements) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </FadeIn>

      {/* Achievements by category */}
      {categories.map((category, catIdx) => {
        const categoryAchievements = achievements.filter(
          (a) => a.category === category,
        );
        return (
          <FadeIn key={category} delay={0.15 + catIdx * 0.05}>
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gray-700">
                {CATEGORY_LABELS[category] || category}
              </h2>
              <StaggerContainer className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {categoryAchievements.map((achievement) => (
                  <StaggerItem key={achievement.id}>
                    <div
                      className={`flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition ${
                        achievement.unlocked
                          ? "bg-white shadow-sm"
                          : "bg-gray-100 opacity-50 grayscale"
                      }`}
                    >
                      <ScaleIn delay={achievement.unlocked ? 0 : 0}>
                        <span className="text-4xl">
                          {achievement.unlocked ? achievement.emoji : "🔒"}
                        </span>
                      </ScaleIn>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {achievement.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </FadeIn>
        );
      })}

      {achievements.length === 0 && (
        <FadeIn delay={0.2}>
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-4xl">🏅</p>
            <p className="mt-2 text-lg text-gray-500">
              No achievements yet. Complete chores to start earning badges!
            </p>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
