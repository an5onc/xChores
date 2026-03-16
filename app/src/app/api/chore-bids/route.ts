import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Chore Marketplace / Bidding System
 *
 * Kids can bid on AVAILABLE chores with a custom dollar amount.
 * Parents see bids and can accept (updating the chore value) or reject.
 * Uses ChoreInstance + a separate bids table (ChoreBid model).
 *
 * Since we avoid modifying schema.prisma here (migration handled separately),
 * we store bids as JSON metadata on the ChoreInstance's parentNote field
 * until the ChoreBid model is available. Format:
 *   { bids: [{ userId, userName, amount, createdAt }] }
 *
 * Actually, let's use a clean approach: store bids in the ChoreBid model
 * which will be added to the schema.
 */

// GET: List bids for available chores in the family
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const familyId = session.user.familyId;
  const role = session.user.role;

  const bids = await db.choreBid.findMany({
    where: {
      choreInstance: { chore: { familyId } },
      ...(role === "CHILD" ? { userId: session.user.id } : {}),
    },
    include: {
      user: { select: { id: true, name: true, avatarId: true } },
      choreInstance: {
        include: { chore: { select: { title: true, dollarValue: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bids);
}

// POST: Kid places a bid on a chore instance
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CHILD") {
    return NextResponse.json({ error: "Only kids can bid." }, { status: 403 });
  }

  const { instanceId, bidAmount, message } = await req.json();

  if (!instanceId || bidAmount === undefined) {
    return NextResponse.json({ error: "instanceId and bidAmount required." }, { status: 400 });
  }

  const amount = parseFloat(bidAmount);
  if (amount <= 0) {
    return NextResponse.json({ error: "Bid must be positive." }, { status: 400 });
  }

  // Verify instance exists and is available
  const instance = await db.choreInstance.findUnique({
    where: { id: instanceId },
    include: { chore: true },
  });

  if (!instance || instance.status !== "AVAILABLE") {
    return NextResponse.json({ error: "Chore not available for bidding." }, { status: 400 });
  }

  // Check for existing bid by this user on this instance
  const existing = await db.choreBid.findFirst({
    where: { choreInstanceId: instanceId, userId: session.user.id, status: "PENDING" },
  });

  if (existing) {
    // Update existing bid
    const updated = await db.choreBid.update({
      where: { id: existing.id },
      data: { amount, message: message || null },
    });
    return NextResponse.json(updated);
  }

  const bid = await db.choreBid.create({
    data: {
      choreInstanceId: instanceId,
      userId: session.user.id,
      amount,
      message: message || null,
    },
  });

  return NextResponse.json(bid, { status: 201 });
}

// PATCH: Parent accepts or rejects a bid
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Only parents can manage bids." }, { status: 403 });
  }

  const { bidId, action } = await req.json();

  if (!bidId || !["accept", "reject"].includes(action)) {
    return NextResponse.json({ error: "bidId and action (accept/reject) required." }, { status: 400 });
  }

  const bid = await db.choreBid.findUnique({
    where: { id: bidId },
    include: { choreInstance: { include: { chore: true } } },
  });

  if (!bid || bid.status !== "PENDING") {
    return NextResponse.json({ error: "Bid not found or already resolved." }, { status: 404 });
  }

  if (action === "accept") {
    // Accept this bid: update chore value, claim for the kid, reject other bids
    await db.$transaction([
      // Update the chore's dollar value to the bid amount
      db.chore.update({
        where: { id: bid.choreInstance.choreId },
        data: { dollarValue: bid.amount },
      }),
      // Claim the chore instance for the bidding kid
      db.choreInstance.update({
        where: { id: bid.choreInstanceId },
        data: { claimedById: bid.userId, status: "CLAIMED" },
      }),
      // Accept this bid
      db.choreBid.update({
        where: { id: bidId },
        data: { status: "ACCEPTED" },
      }),
    ]);

    // Reject all other pending bids on this instance
    await db.choreBid.updateMany({
      where: {
        choreInstanceId: bid.choreInstanceId,
        id: { not: bidId },
        status: "PENDING",
      },
      data: { status: "REJECTED" },
    });

    return NextResponse.json({ success: true, action: "accepted" });
  }

  // Reject
  await db.choreBid.update({
    where: { id: bidId },
    data: { status: "REJECTED" },
  });

  return NextResponse.json({ success: true, action: "rejected" });
}
