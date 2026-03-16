import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db before importing module
vi.mock("@/lib/db", () => ({
  db: {
    choreInstance: { findMany: vi.fn() },
    wallet: { findUnique: vi.fn(), update: vi.fn() },
    transaction: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { updateStreak, awardStreakBonus } from "@/lib/streaks";
import { db } from "@/lib/db";

const mockedDb = vi.mocked(db);

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

describe("updateStreak", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 streak when no approved instances", async () => {
    mockedDb.choreInstance.findMany.mockResolvedValue([]);

    const result = await updateStreak("user-1");

    expect(result).toEqual({
      currentStreak: 0,
      isNewMilestone: false,
      milestoneBonus: 0,
    });
  });

  it("counts consecutive days correctly", async () => {
    // 3 consecutive days: today, yesterday, day before
    mockedDb.choreInstance.findMany.mockResolvedValue([
      { completedAt: daysAgo(0) },
      { completedAt: daysAgo(1) },
      { completedAt: daysAgo(2) },
    ] as any);

    const result = await updateStreak("user-1");

    expect(result.currentStreak).toBe(3);
    expect(result.isNewMilestone).toBe(true);
    expect(result.milestoneBonus).toBe(0.5);
  });

  it("breaks streak on gap day", async () => {
    // Today and 2 days ago (gap yesterday)
    mockedDb.choreInstance.findMany.mockResolvedValue([
      { completedAt: daysAgo(0) },
      { completedAt: daysAgo(2) },
    ] as any);

    const result = await updateStreak("user-1");

    expect(result.currentStreak).toBe(1);
  });

  it("returns 0 when most recent day is more than yesterday", async () => {
    mockedDb.choreInstance.findMany.mockResolvedValue([
      { completedAt: daysAgo(3) },
    ] as any);

    const result = await updateStreak("user-1");

    expect(result.currentStreak).toBe(0);
  });

  it("deduplicates multiple chores on same day", async () => {
    const today = daysAgo(0);
    const today2 = new Date(today);
    today2.setHours(15, 0, 0, 0);

    mockedDb.choreInstance.findMany.mockResolvedValue([
      { completedAt: today },
      { completedAt: today2 },
      { completedAt: daysAgo(1) },
    ] as any);

    const result = await updateStreak("user-1");

    expect(result.currentStreak).toBe(2);
  });

  it("identifies 7-day milestone", async () => {
    const instances = Array.from({ length: 7 }, (_, i) => ({
      completedAt: daysAgo(i),
    }));
    mockedDb.choreInstance.findMany.mockResolvedValue(instances as any);

    const result = await updateStreak("user-1");

    expect(result.currentStreak).toBe(7);
    expect(result.isNewMilestone).toBe(true);
    expect(result.milestoneBonus).toBe(1.0);
  });
});

describe("awardStreakBonus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("awards bonus to wallet via transaction", async () => {
    mockedDb.wallet.findUnique.mockResolvedValue({ id: "wallet-1" } as any);
    mockedDb.$transaction.mockResolvedValue(undefined as any);

    await awardStreakBonus("user-1", 7, 1.0);

    expect(mockedDb.wallet.findUnique).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(mockedDb.$transaction).toHaveBeenCalledTimes(1);
  });

  it("throws when wallet not found", async () => {
    mockedDb.wallet.findUnique.mockResolvedValue(null);

    await expect(awardStreakBonus("user-1", 7, 1.0)).rejects.toThrow(
      "Wallet not found"
    );
  });
});
