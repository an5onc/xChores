import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    purchaseRequest: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    storeItem: { findUnique: vi.fn() },
    wallet: { findUnique: vi.fn(), update: vi.fn() },
    transaction: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
  notifyParents: vi.fn(),
}));

import { GET, POST, PATCH } from "../route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const mockedAuth = vi.mocked(auth);
const mockedDb = vi.mocked(db);

function mockReq(body: any): any {
  return { json: () => Promise.resolve(body) };
}

describe("Store Purchases API", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("POST - kid purchase request", () => {
    it("rejects parents from making purchase requests", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "p1", role: "PARENT", familyId: "f1", name: "Parent" },
      } as any);

      const res = await POST(mockReq({ storeItemId: "item-1" }));
      expect(res.status).toBe(403);
    });

    it("rejects if item not found", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "k1", role: "CHILD", familyId: "f1", name: "Kid" },
      } as any);
      mockedDb.storeItem.findUnique.mockResolvedValue(null);

      const res = await POST(mockReq({ storeItemId: "item-1" }));
      expect(res.status).toBe(404);
    });

    it("rejects if insufficient balance", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "k1", role: "CHILD", familyId: "f1", name: "Kid" },
      } as any);
      mockedDb.storeItem.findUnique.mockResolvedValue({
        id: "item-1",
        price: 10.0,
        isActive: true,
      } as any);
      mockedDb.wallet.findUnique.mockResolvedValue({
        availableBalance: 5.0,
      } as any);

      const res = await POST(mockReq({ storeItemId: "item-1" }));
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("Insufficient");
    });

    it("rejects duplicate pending request", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "k1", role: "CHILD", familyId: "f1", name: "Kid" },
      } as any);
      mockedDb.storeItem.findUnique.mockResolvedValue({
        id: "item-1",
        price: 5.0,
        isActive: true,
      } as any);
      mockedDb.wallet.findUnique.mockResolvedValue({
        availableBalance: 10.0,
      } as any);
      mockedDb.purchaseRequest.findFirst.mockResolvedValue({
        id: "existing",
      } as any);

      const res = await POST(mockReq({ storeItemId: "item-1" }));
      expect(res.status).toBe(400);
    });

    it("creates purchase request successfully", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "k1", role: "CHILD", familyId: "f1", name: "Kid" },
      } as any);
      mockedDb.storeItem.findUnique.mockResolvedValue({
        id: "item-1",
        name: "Toy",
        price: 5.0,
        isActive: true,
      } as any);
      mockedDb.wallet.findUnique.mockResolvedValue({
        availableBalance: 10.0,
      } as any);
      mockedDb.purchaseRequest.findFirst.mockResolvedValue(null);
      mockedDb.purchaseRequest.create.mockResolvedValue({
        id: "purchase-1",
        storeItem: { name: "Toy" },
      } as any);

      const res = await POST(mockReq({ storeItemId: "item-1" }));
      expect(res.status).toBe(201);
    });
  });

  describe("PATCH - parent approve/reject", () => {
    it("rejects non-parents", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "k1", role: "CHILD", familyId: "f1" },
      } as any);

      const res = await PATCH(
        mockReq({ purchaseId: "p1", action: "approve" })
      );
      expect(res.status).toBe(403);
    });

    it("approves purchase and deducts wallet", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "p1", role: "PARENT", familyId: "f1" },
      } as any);
      mockedDb.purchaseRequest.findUnique.mockResolvedValue({
        id: "purchase-1",
        userId: "k1",
        status: "PENDING",
        storeItem: { name: "Toy", price: 5.0 },
      } as any);
      mockedDb.wallet.findUnique.mockResolvedValue({
        availableBalance: 10.0,
      } as any);
      mockedDb.$transaction.mockResolvedValue(undefined as any);

      const res = await PATCH(
        mockReq({ purchaseId: "purchase-1", action: "approve" })
      );
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.action).toBe("approved");
      expect(mockedDb.$transaction).toHaveBeenCalled();
    });

    it("rejects purchase request", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "p1", role: "PARENT", familyId: "f1" },
      } as any);
      mockedDb.purchaseRequest.findUnique.mockResolvedValue({
        id: "purchase-1",
        userId: "k1",
        status: "PENDING",
        storeItem: { name: "Toy", price: 5.0 },
      } as any);
      mockedDb.purchaseRequest.update.mockResolvedValue({} as any);

      const res = await PATCH(
        mockReq({
          purchaseId: "purchase-1",
          action: "reject",
          parentNote: "Not today",
        })
      );
      const data = await res.json();

      expect(data.action).toBe("rejected");
    });

    it("fails approval if kid balance dropped", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: "p1", role: "PARENT", familyId: "f1" },
      } as any);
      mockedDb.purchaseRequest.findUnique.mockResolvedValue({
        id: "purchase-1",
        userId: "k1",
        status: "PENDING",
        storeItem: { name: "Toy", price: 10.0 },
      } as any);
      mockedDb.wallet.findUnique.mockResolvedValue({
        availableBalance: 3.0,
      } as any);

      const res = await PATCH(
        mockReq({ purchaseId: "purchase-1", action: "approve" })
      );
      expect(res.status).toBe(400);
    });
  });
});
