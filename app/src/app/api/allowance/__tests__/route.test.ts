import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    allowanceRule: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    wallet: { update: vi.fn() },
    transaction: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
}));

import { GET, POST, PATCH, DELETE } from "../route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const mockedAuth = vi.mocked(auth);
const mockedDb = vi.mocked(db);

function mockRequest(body: any): any {
  return { json: () => Promise.resolve(body) } as any;
}

describe("Allowance API", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockedAuth.mockResolvedValue(null as any);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized.");
    });

    it("returns allowance rules for the family", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "p1", role: "PARENT", familyId: "f1" },
      } as any);
      const rules = [{ id: "rule-1", amount: 5.0, frequency: "WEEKLY" }];
      mockedDb.allowanceRule.findMany.mockResolvedValue(rules as any);

      const res = await GET();
      const data = await res.json();

      expect(data).toEqual(rules);
      expect(mockedDb.allowanceRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { familyId: "f1" },
        })
      );
    });
  });

  describe("POST - create rule", () => {
    it("rejects non-parents", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "k1", role: "CHILD", familyId: "f1" },
      } as any);

      const res = await POST(
        mockRequest({ userId: "k1", amount: 5, frequency: "WEEKLY" })
      );
      expect(res.status).toBe(403);
    });

    it("validates required fields", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "p1", role: "PARENT", familyId: "f1" },
      } as any);

      const res = await POST(mockRequest({ userId: "k1" }));
      expect(res.status).toBe(400);
    });

    it("validates frequency value", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "p1", role: "PARENT", familyId: "f1" },
      } as any);

      const res = await POST(
        mockRequest({ userId: "k1", amount: 5, frequency: "DAILY" })
      );
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("WEEKLY or MONTHLY");
    });

    it("creates a weekly allowance rule", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "p1", role: "PARENT", familyId: "f1" },
      } as any);
      const rule = {
        id: "rule-1",
        userId: "k1",
        amount: 5.0,
        frequency: "WEEKLY",
        dayOfWeek: 0,
      };
      mockedDb.allowanceRule.create.mockResolvedValue(rule as any);

      const res = await POST(
        mockRequest({ userId: "k1", amount: "5", frequency: "WEEKLY" })
      );
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.id).toBe("rule-1");
    });
  });

  describe("POST - process allowances", () => {
    it("processes due allowances and skips already-paid", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "p1", role: "PARENT", familyId: "f1" },
      } as any);

      const today = new Date();
      const rules = [
        {
          id: "rule-1",
          userId: "k1",
          amount: 5.0,
          frequency: "WEEKLY",
          lastPaidAt: null,
          user: { id: "k1", name: "Kid" },
        },
        {
          id: "rule-2",
          userId: "k2",
          amount: 3.0,
          frequency: "WEEKLY",
          lastPaidAt: today, // Already paid today
          user: { id: "k2", name: "Kid2" },
        },
      ];
      mockedDb.allowanceRule.findMany.mockResolvedValue(rules as any);
      mockedDb.$transaction.mockResolvedValue(undefined as any);

      const res = await POST(mockRequest({ action: "process" }));
      const data = await res.json();

      expect(data.processed).toBe(1);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].userId).toBe("k1");
    });
  });

  describe("PATCH", () => {
    it("requires ruleId", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "p1", role: "PARENT", familyId: "f1" },
      } as any);

      const res = await PATCH(mockRequest({ amount: 10 }));
      expect(res.status).toBe(400);
    });

    it("updates an allowance rule", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "p1", role: "PARENT", familyId: "f1" },
      } as any);
      mockedDb.allowanceRule.update.mockResolvedValue({
        id: "rule-1",
        amount: 10,
      } as any);

      const res = await PATCH(mockRequest({ ruleId: "rule-1", amount: "10" }));
      const data = await res.json();

      expect(data.amount).toBe(10);
    });
  });

  describe("DELETE", () => {
    it("deletes an allowance rule", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "p1", role: "PARENT", familyId: "f1" },
      } as any);
      mockedDb.allowanceRule.delete.mockResolvedValue({} as any);

      const res = await DELETE(mockRequest({ ruleId: "rule-1" }));
      const data = await res.json();

      expect(data.success).toBe(true);
    });
  });
});
