import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification, notifyParents } from "@/lib/notifications";

// GET: List purchase requests
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const familyId = session.user.familyId;
  const isParent = session.user.role === "PARENT";

  const purchases = await db.purchaseRequest.findMany({
    where: isParent
      ? { storeItem: { familyId } }
      : { userId: session.user.id },
    include: {
      storeItem: true,
      user: { select: { id: true, name: true, avatarId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(purchases);
}

// POST: Kid requests a purchase
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CHILD") {
    return NextResponse.json({ error: "Only kids can make purchase requests." }, { status: 403 });
  }

  const { storeItemId } = await req.json();

  if (!storeItemId) {
    return NextResponse.json({ error: "storeItemId required." }, { status: 400 });
  }

  const item = await db.storeItem.findUnique({ where: { id: storeItemId } });
  if (!item || !item.isActive) {
    return NextResponse.json({ error: "Item not available." }, { status: 404 });
  }

  // Check balance
  const wallet = await db.wallet.findUnique({ where: { userId: session.user.id } });
  if (!wallet || wallet.availableBalance < item.price) {
    return NextResponse.json({ error: "Insufficient balance." }, { status: 400 });
  }

  // Check for existing pending request for same item
  const existing = await db.purchaseRequest.findFirst({
    where: { userId: session.user.id, storeItemId, status: "PENDING" },
  });
  if (existing) {
    return NextResponse.json({ error: "You already have a pending request for this item." }, { status: 400 });
  }

  const purchase = await db.purchaseRequest.create({
    data: {
      userId: session.user.id,
      storeItemId,
    },
    include: { storeItem: true },
  });

  // Notify parents
  await notifyParents(session.user.familyId, {
    type: "chore_submitted", // reuse type for purchase request notification
    title: "Purchase request!",
    message: `${session.user.name} wants to buy "${item.name}" for $${item.price.toFixed(2)}`,
    metadata: { purchaseId: purchase.id, itemId: item.id },
  });

  return NextResponse.json(purchase, { status: 201 });
}

// PATCH: Parent approves or rejects a purchase
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Only parents can manage purchases." }, { status: 403 });
  }

  const { purchaseId, action, parentNote } = await req.json();

  if (!purchaseId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "purchaseId and action (approve/reject) required." }, { status: 400 });
  }

  const purchase = await db.purchaseRequest.findUnique({
    where: { id: purchaseId },
    include: { storeItem: true },
  });

  if (!purchase || purchase.status !== "PENDING") {
    return NextResponse.json({ error: "Purchase not found or already resolved." }, { status: 404 });
  }

  if (action === "approve") {
    const wallet = await db.wallet.findUnique({ where: { userId: purchase.userId } });
    if (!wallet || wallet.availableBalance < purchase.storeItem.price) {
      return NextResponse.json({ error: "Kid no longer has sufficient balance." }, { status: 400 });
    }

    await db.$transaction([
      db.purchaseRequest.update({
        where: { id: purchaseId },
        data: { status: "APPROVED", parentNote: parentNote || null },
      }),
      db.wallet.update({
        where: { userId: purchase.userId },
        data: { availableBalance: { decrement: purchase.storeItem.price } },
      }),
      db.transaction.create({
        data: {
          wallet: { connect: { userId: purchase.userId } },
          type: "SPENDING",
          amount: purchase.storeItem.price,
          description: `Purchased: ${purchase.storeItem.name}`,
        },
      }),
    ]);

    await createNotification({
      userId: purchase.userId,
      type: "chore_approved",
      title: "Purchase approved!",
      message: `Your request for "${purchase.storeItem.name}" was approved!`,
      metadata: { purchaseId },
    });

    return NextResponse.json({ success: true, action: "approved" });
  }

  // Reject
  await db.purchaseRequest.update({
    where: { id: purchaseId },
    data: { status: "REJECTED", parentNote: parentNote || null },
  });

  await createNotification({
    userId: purchase.userId,
    type: "chore_rejected",
    title: "Purchase declined",
    message: `Your request for "${purchase.storeItem.name}" was declined.${parentNote ? ` Note: ${parentNote}` : ""}`,
    metadata: { purchaseId },
  });

  return NextResponse.json({ success: true, action: "rejected" });
}
