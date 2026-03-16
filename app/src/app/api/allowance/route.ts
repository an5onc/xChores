import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

// GET: List allowance rules for the family
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rules = await db.allowanceRule.findMany({
    where: { familyId: session.user.familyId },
    include: { user: { select: { id: true, name: true, avatarId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rules);
}

// POST: Create or process allowances
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Only parents can manage allowances." }, { status: 403 });
  }

  const body = await req.json();

  // If action is "process", pay out due allowances
  if (body.action === "process") {
    return processAllowances(session.user.familyId);
  }

  // Otherwise, create a new rule
  const { userId, amount, frequency, dayOfWeek, dayOfMonth } = body;

  if (!userId || !amount || !frequency) {
    return NextResponse.json({ error: "userId, amount, and frequency required." }, { status: 400 });
  }

  if (!["WEEKLY", "MONTHLY"].includes(frequency)) {
    return NextResponse.json({ error: "Frequency must be WEEKLY or MONTHLY." }, { status: 400 });
  }

  const rule = await db.allowanceRule.create({
    data: {
      familyId: session.user.familyId,
      userId,
      amount: parseFloat(amount),
      frequency,
      dayOfWeek: frequency === "WEEKLY" ? (dayOfWeek ?? 0) : null,
      dayOfMonth: frequency === "MONTHLY" ? (dayOfMonth ?? 1) : null,
    },
    include: { user: { select: { id: true, name: true, avatarId: true } } },
  });

  return NextResponse.json(rule, { status: 201 });
}

// PATCH: Update or toggle an allowance rule
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Only parents can manage allowances." }, { status: 403 });
  }

  const { ruleId, amount, isActive } = await req.json();

  if (!ruleId) {
    return NextResponse.json({ error: "ruleId required." }, { status: 400 });
  }

  const rule = await db.allowanceRule.update({
    where: { id: ruleId },
    data: {
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(rule);
}

// DELETE: Remove an allowance rule
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Only parents can manage allowances." }, { status: 403 });
  }

  const { ruleId } = await req.json();
  await db.allowanceRule.delete({ where: { id: ruleId } });
  return NextResponse.json({ success: true });
}

// Process due allowances
async function processAllowances(familyId: string) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const dayOfMonth = now.getDate();

  const rules = await db.allowanceRule.findMany({
    where: {
      familyId,
      isActive: true,
      OR: [
        { frequency: "WEEKLY", dayOfWeek },
        { frequency: "MONTHLY", dayOfMonth },
      ],
    },
    include: { user: { select: { id: true, name: true } } },
  });

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const results: { userId: string; name: string; amount: number }[] = [];

  for (const rule of rules) {
    // Skip if already paid today
    if (rule.lastPaidAt) {
      const lastPaid = new Date(rule.lastPaidAt);
      lastPaid.setHours(0, 0, 0, 0);
      if (lastPaid.getTime() >= today.getTime()) continue;
    }

    await db.$transaction([
      db.wallet.update({
        where: { userId: rule.userId },
        data: { availableBalance: { increment: rule.amount } },
      }),
      db.transaction.create({
        data: {
          wallet: { connect: { userId: rule.userId } },
          type: "BONUS",
          amount: rule.amount,
          description: `${rule.frequency === "WEEKLY" ? "Weekly" : "Monthly"} allowance`,
        },
      }),
      db.allowanceRule.update({
        where: { id: rule.id },
        data: { lastPaidAt: now },
      }),
    ]);

    await createNotification({
      userId: rule.userId,
      type: "savings_match",
      title: "Allowance received!",
      message: `You received your ${rule.frequency.toLowerCase()} allowance of $${rule.amount.toFixed(2)}`,
    });

    results.push({ userId: rule.userId, name: rule.user.name, amount: rule.amount });
  }

  return NextResponse.json({ processed: results.length, results });
}
