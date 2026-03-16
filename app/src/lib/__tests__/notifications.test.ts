import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    notification: { create: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

import { createNotification, notifyParents } from "@/lib/notifications";
import { db } from "@/lib/db";

const mockedDb = vi.mocked(db);

describe("createNotification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a notification with correct data", async () => {
    mockedDb.notification.create.mockResolvedValue({ id: "notif-1" } as any);

    await createNotification({
      userId: "user-1",
      type: "chore_approved",
      title: "Great job!",
      message: "Your chore was approved",
    });

    expect(mockedDb.notification.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "chore_approved",
        title: "Great job!",
        message: "Your chore was approved",
        metadata: null,
      },
    });
  });

  it("stringifies metadata when provided", async () => {
    mockedDb.notification.create.mockResolvedValue({ id: "notif-1" } as any);

    await createNotification({
      userId: "user-1",
      type: "achievement_unlocked",
      title: "Achievement!",
      message: "You unlocked something",
      metadata: { achievementId: "ach-1" },
    });

    expect(mockedDb.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: JSON.stringify({ achievementId: "ach-1" }),
      }),
    });
  });
});

describe("notifyParents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("notifies all parents in the family", async () => {
    mockedDb.user.findMany.mockResolvedValue([
      { id: "parent-1" },
      { id: "parent-2" },
    ] as any);
    mockedDb.notification.create.mockResolvedValue({ id: "n" } as any);

    await notifyParents("family-1", {
      type: "chore_submitted",
      title: "Chore submitted",
      message: "Kid submitted a chore",
    });

    expect(mockedDb.user.findMany).toHaveBeenCalledWith({
      where: { familyId: "family-1", role: "PARENT" },
      select: { id: true },
    });
    expect(mockedDb.notification.create).toHaveBeenCalledTimes(2);
  });
});
