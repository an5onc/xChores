"use client";

import { useEffect, useState } from "react";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  BalanceChange,
} from "@/components/shared/animations";

const AVATARS = [
  "\u{1F981}", "\u{1F42F}", "\u{1F43B}", "\u{1F43C}", "\u{1F98A}", "\u{1F430}",
  "\u{1F438}", "\u{1F435}", "\u{1F984}", "\u{1F432}", "\u{1F98B}", "\u{1F422}",
  "\u{1F42C}", "\u{1F99C}", "\u{1F436}", "\u{1F431}",
];

interface LeaderboardEntry {
  id: string;
  name: string;
  avatarId: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  weeklyChoresCompleted: number;
  monthlyChoresCompleted: number;
  currentStreak: number;
  totalAchievements: number;
}

type TimeFrame = "week" | "month";

function getRankEmoji(rank: number): string {
  if (rank === 1) return "\u{1F451}";
  if (rank === 2) return "\u{1F948}";
  if (rank === 3) return "\u{1F949}";
  return "";
}

function getRankColor(rank: number): string {
  if (rank === 1) return "bg-emerald-50 border-emerald-300 ring-emerald-200";
  if (rank === 2) return "bg-sky-50 border-sky-300 ring-sky-200";
  if (rank === 3) return "bg-amber-50 border-amber-300 ring-amber-200";
  return "bg-white border-gray-200";
}

function getRankTextColor(rank: number): string {
  if (rank === 1) return "text-emerald-700";
  if (rank === 2) return "text-sky-700";
  if (rank === 3) return "text-amber-700";
  return "text-gray-700";
}

function getEarnings(entry: LeaderboardEntry, timeFrame: TimeFrame): number {
  return timeFrame === "week" ? entry.weeklyEarnings : entry.monthlyEarnings;
}

function getChores(entry: LeaderboardEntry, timeFrame: TimeFrame): number {
  return timeFrame === "week"
    ? entry.weeklyChoresCompleted
    : entry.monthlyChoresCompleted;
}

function sortedEntries(
  entries: LeaderboardEntry[],
  timeFrame: TimeFrame
): LeaderboardEntry[] {
  return [...entries].sort(
    (a, b) => getEarnings(b, timeFrame) - getEarnings(a, timeFrame)
  );
}

function FamilyStats({
  data,
  timeFrame,
}: {
  data: LeaderboardEntry[];
  timeFrame: TimeFrame;
}) {
  const totalEarnings = data.reduce(
    (sum, e) => sum + getEarnings(e, timeFrame),
    0
  );
  const totalChores = data.reduce(
    (sum, e) => sum + getChores(e, timeFrame),
    0
  );
  const totalAchievements = data.reduce(
    (sum, e) => sum + e.totalAchievements,
    0
  );
  const longestStreak = Math.max(0, ...data.map((e) => e.currentStreak));

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
        <div className="text-xs text-emerald-600 font-medium">
          Total Earned
        </div>
        <div className="text-xl font-bold text-emerald-700 mt-1">
          <BalanceChange value={totalEarnings} />
        </div>
      </div>
      <div className="bg-sky-50 rounded-xl p-4 text-center border border-sky-200">
        <div className="text-xs text-sky-600 font-medium">
          Chores Done
        </div>
        <div className="text-xl font-bold text-sky-700 mt-1">
          {totalChores}
        </div>
      </div>
      <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
        <div className="text-xs text-amber-600 font-medium">
          Achievements
        </div>
        <div className="text-xl font-bold text-amber-700 mt-1">
          {"\u{1F3C6}"} {totalAchievements}
        </div>
      </div>
      <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-200">
        <div className="text-xs text-orange-600 font-medium">
          Best Streak
        </div>
        <div className="text-xl font-bold text-orange-700 mt-1">
          {"\u{1F525}"} {longestStreak} days
        </div>
      </div>
    </div>
  );
}

function PodiumCard({
  entry,
  rank,
  timeFrame,
  isCenter,
}: {
  entry: LeaderboardEntry;
  rank: number;
  timeFrame: TimeFrame;
  isCenter: boolean;
}) {
  const avatar = AVATARS[(entry.avatarId - 1) % AVATARS.length];
  return (
    <div
      className={`flex flex-col items-center ${isCenter ? "order-2 -mt-4" : rank === 2 ? "order-1 mt-4" : "order-3 mt-4"}`}
    >
      <div className="text-2xl mb-1">{getRankEmoji(rank)}</div>
      <div
        className={`rounded-2xl border-2 p-4 ${getRankColor(rank)} ${isCenter ? "ring-2" : ""} text-center min-w-[120px]`}
      >
        <div className="text-4xl mb-1">{avatar}</div>
        <div className={`font-bold text-sm ${getRankTextColor(rank)}`}>
          {entry.name}
        </div>
        <div className={`text-lg font-bold mt-1 ${getRankTextColor(rank)}`}>
          <BalanceChange value={getEarnings(entry, timeFrame)} />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {getChores(entry, timeFrame)} chores
        </div>
        {entry.currentStreak > 0 && (
          <div className="text-xs text-orange-500 mt-0.5">
            {"\u{1F525}"} {entry.currentStreak} day streak
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  rank,
  timeFrame,
}: {
  entry: LeaderboardEntry;
  rank: number;
  timeFrame: TimeFrame;
}) {
  const avatar = AVATARS[(entry.avatarId - 1) % AVATARS.length];
  return (
    <StaggerItem>
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border ${getRankColor(rank)}`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankTextColor(rank)} bg-white/70`}
        >
          {rank <= 3 ? getRankEmoji(rank) : `#${rank}`}
        </div>
        <div className="text-2xl">{avatar}</div>
        <div className="flex-1">
          <div className={`font-semibold text-sm ${getRankTextColor(rank)}`}>
            {entry.name}
          </div>
          <div className="text-xs text-gray-500">
            {getChores(entry, timeFrame)} chores
            {entry.currentStreak > 0 &&
              ` \u00B7 ${"\u{1F525}"} ${entry.currentStreak} days`}
            {entry.totalAchievements > 0 &&
              ` \u00B7 ${"\u{1F3C6}"} ${entry.totalAchievements}`}
          </div>
        </div>
        <div className={`font-bold ${getRankTextColor(rank)}`}>
          <BalanceChange value={getEarnings(entry, timeFrame)} />
        </div>
      </div>
    </StaggerItem>
  );
}

export default function ParentLeaderboardPage() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("week");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setData(d.leaderboard ?? []))
      .finally(() => setLoading(false));
  }, []);

  const sorted = sortedEntries(data, timeFrame);
  const showPodium = sorted.length >= 3;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {"\u{1F3C6}"} Family Leaderboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            See how your kids are doing!
          </p>
        </div>
      </FadeIn>

      {/* Time frame toggle */}
      <FadeIn delay={0.1}>
        <div className="flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setTimeFrame("week")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              timeFrame === "week"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeFrame("month")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              timeFrame === "month"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            This Month
          </button>
        </div>
      </FadeIn>

      {/* Family Stats Summary */}
      {data.length > 0 && (
        <FadeIn delay={0.15}>
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Family Stats
          </h2>
          <FamilyStats data={data} timeFrame={timeFrame} />
        </FadeIn>
      )}

      {sorted.length === 0 ? (
        <FadeIn delay={0.2}>
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">{"\u{1F3C6}"}</div>
            <p>No kids in the family yet!</p>
          </div>
        </FadeIn>
      ) : (
        <>
          {/* Podium for top 3 */}
          {showPodium && (
            <FadeIn delay={0.3}>
              <div className="flex justify-center items-end gap-3 pt-4 pb-2">
                <PodiumCard
                  entry={sorted[1]}
                  rank={2}
                  timeFrame={timeFrame}
                  isCenter={false}
                />
                <PodiumCard
                  entry={sorted[0]}
                  rank={1}
                  timeFrame={timeFrame}
                  isCenter={true}
                />
                <PodiumCard
                  entry={sorted[2]}
                  rank={3}
                  timeFrame={timeFrame}
                  isCenter={false}
                />
              </div>
            </FadeIn>
          )}

          {/* Full list */}
          <StaggerContainer delay={showPodium ? 0.5 : 0.3} className="space-y-2">
            {(!showPodium ? sorted : sorted.slice(3)).map((entry, i) => (
              <LeaderboardRow
                key={entry.id}
                entry={entry}
                rank={showPodium ? i + 4 : i + 1}
                timeFrame={timeFrame}
              />
            ))}
          </StaggerContainer>
        </>
      )}
    </div>
  );
}
