import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: TV/kiosk dashboard data (no auth, uses family token)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const family = await db.family.findUnique({
    where: { tvToken: token },
    include: {
      members: {
        where: { role: "CHILD" },
        include: {
          wallet: true,
          savingsGoals: { where: { isCompleted: false } },
          investments: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  if (!family) {
    return NextResponse.json({ error: "Invalid token." }, { status: 404 });
  }

  // Get today's chore instances
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayChores = await db.choreInstance.findMany({
    where: {
      chore: { familyId: family.id },
      createdAt: { gte: today },
    },
    include: {
      chore: true,
      claimedBy: { select: { name: true, avatarId: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Recent transactions
  const recentTransactions = await db.transaction.findMany({
    where: { wallet: { user: { familyId: family.id } } },
    include: { wallet: { include: { user: { select: { name: true, avatarId: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    familyName: family.name,
    members: family.members.map((m: typeof family.members[number]) => ({
      id: m.id,
      name: m.name,
      avatarId: m.avatarId,
      wallet: m.wallet,
      savingsGoals: m.savingsGoals,
      activeInvestments: m.investments.length,
    })),
    todayChores,
    recentTransactions,
    updatedAt: new Date().toISOString(),
  });
}
