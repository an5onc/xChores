import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: List investments
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const role = session.user.role;
  const familyId = session.user.familyId;

  const investments =
    role === "PARENT"
      ? await db.investment.findMany({
          where: { user: { familyId } },
          include: { user: { select: { id: true, name: true, avatarId: true } } },
          orderBy: { createdAt: "desc" },
        })
      : await db.investment.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        });

  return NextResponse.json(investments);
}

// PATCH: Parent sets return amount on matured investment
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { investmentId, returnAmount, parentNote } = await req.json();

  if (!investmentId || returnAmount === undefined) {
    return NextResponse.json(
      { error: "Investment ID and return amount required." },
      { status: 400 }
    );
  }

  const investment = await db.investment.findUnique({
    where: { id: investmentId },
  });

  if (!investment) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (investment.status !== "ACTIVE") {
    return NextResponse.json({ error: "Investment not active." }, { status: 400 });
  }

  // Check if maturation date has passed
  if (new Date() < investment.maturationDate) {
    return NextResponse.json({ error: "Investment has not matured yet." }, { status: 400 });
  }

  const payout = parseFloat(returnAmount);

  // Mature the investment and pay out
  await db.$transaction([
    db.investment.update({
      where: { id: investmentId },
      data: {
        status: "MATURED",
        returnAmount: payout,
        parentNote: parentNote || null,
        maturedAt: new Date(),
      },
    }),
    db.wallet.update({
      where: { userId: investment.userId },
      data: {
        investedBalance: { decrement: investment.principalAmount },
        availableBalance: { increment: payout },
      },
    }),
    db.transaction.create({
      data: {
        wallet: { connect: { userId: investment.userId } },
        type: "MATURATION",
        amount: payout,
        description: `Investment matured! Invested $${investment.principalAmount.toFixed(2)}, earned $${payout.toFixed(2)}`,
        investmentId,
      },
    }),
  ]);

  return NextResponse.json({ success: true, payout });
}
