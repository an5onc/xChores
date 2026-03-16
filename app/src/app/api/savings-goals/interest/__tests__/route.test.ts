import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    familySettings: { findUnique: vi.fn() },
    savingsGoal: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    wallet: { update: vi.fn() },
    transaction: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
}));

import { POST } from "../route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const mockedAuth = vi.mocked(auth);
const mockedDb = vi.mocked(db);

describe("Savings Interest API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 for non-parents", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "k1", role: "CHILD", familyId: "f1" },
    } as any);

    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("returns 0 processed when interest rate is 0", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "p1", role: "PARENT", familyId: "f1" },
    } as any);
    mockedDb.familySettings.findUnique.mockResolvedValue({
      savingsInterestRate: 0,
    } as any);

    const res = await POST();
    const data = await res.json();

    expect(data.processed).toBe(0);
  });

  it("applies interest to active goals", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "p1", role: "PARENT", familyId: "f1" },
    } as any);
    mockedDb.familySettings.findUnique.mockResolvedValue({
      savingsInterestRate: 0.05,
    } as any);
    mockedDb.savingsGoal.findMany.mockResolvedValue([
      {
        id: "goal-1",
        name: "Bike",
        userId: "k1",
        currentAmount: 100,
        targetAmount: 200,
        isCompleted: false,
        user: { id: "k1", name: "Kid" },
      },
    ] as any);
    mockedDb.$transaction.mockResolvedValue(undefined as any);
    mockedDb.savingsGoal.findUnique.mockResolvedValue({
      id: "goal-1",
      currentAmount: 105,
      targetAmount: 200,
    } as any);

    const res = await POST();
    const data = await res.json();

    expect(data.processed).toBe(1);
    expect(data.rate).toBe("5.0%");
    expect(data.results[0].interest).toBe(5);
    expect(mockedDb.$transaction).toHaveBeenCalled();
  });

  it("marks goal as complete when interest pushes past target", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "p1", role: "PARENT", familyId: "f1" },
    } as any);
    mockedDb.familySettings.findUnique.mockResolvedValue({
      savingsInterestRate: 0.1,
    } as any);
    mockedDb.savingsGoal.findMany.mockResolvedValue([
      {
        id: "goal-1",
        name: "Game",
        userId: "k1",
        currentAmount: 95,
        targetAmount: 100,
        isCompleted: false,
        user: { id: "k1", name: "Kid" },
      },
    ] as any);
    mockedDb.$transaction.mockResolvedValue(undefined as any);
    // After interest, currentAmount = 95 + 9.5 = 104.5 >= 100
    mockedDb.savingsGoal.findUnique.mockResolvedValue({
      id: "goal-1",
      currentAmount: 104.5,
      targetAmount: 100,
    } as any);

    const res = await POST();
    const data = await res.json();

    expect(data.processed).toBe(1);
    // Should have called update to mark as complete
    expect(mockedDb.savingsGoal.update).toHaveBeenCalledWith({
      where: { id: "goal-1" },
      data: { isCompleted: true },
    });
  });

  it("uses default 2% rate when no settings exist", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "p1", role: "PARENT", familyId: "f1" },
    } as any);
    mockedDb.familySettings.findUnique.mockResolvedValue(null);
    mockedDb.savingsGoal.findMany.mockResolvedValue([
      {
        id: "goal-1",
        name: "Toy",
        userId: "k1",
        currentAmount: 50,
        targetAmount: 200,
        isCompleted: false,
        user: { id: "k1", name: "Kid" },
      },
    ] as any);
    mockedDb.$transaction.mockResolvedValue(undefined as any);
    mockedDb.savingsGoal.findUnique.mockResolvedValue({
      id: "goal-1",
      currentAmount: 51,
      targetAmount: 200,
    } as any);

    const res = await POST();
    const data = await res.json();

    expect(data.rate).toBe("2.0%");
    expect(data.results[0].interest).toBe(1); // 50 * 0.02
  });
});
