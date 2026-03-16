import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Get family settings
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let settings = await db.familySettings.findUnique({
    where: { familyId: session.user.familyId },
  });

  // Create defaults if not exists
  if (!settings) {
    settings = await db.familySettings.create({
      data: { familyId: session.user.familyId },
    });
  }

  return NextResponse.json(settings);
}

// PATCH: Update family settings (parent only)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Only parents can update settings." }, { status: 403 });
  }

  const body = await req.json();
  const {
    maxDailyEarnings,
    maxSpendingPerDay,
    investmentApproval,
    investmentMaxAmount,
    savingsInterestRate,
  } = body;

  const settings = await db.familySettings.upsert({
    where: { familyId: session.user.familyId },
    create: {
      familyId: session.user.familyId,
      ...(maxDailyEarnings !== undefined && { maxDailyEarnings: maxDailyEarnings ? parseFloat(maxDailyEarnings) : null }),
      ...(maxSpendingPerDay !== undefined && { maxSpendingPerDay: maxSpendingPerDay ? parseFloat(maxSpendingPerDay) : null }),
      ...(investmentApproval !== undefined && { investmentApproval }),
      ...(investmentMaxAmount !== undefined && { investmentMaxAmount: investmentMaxAmount ? parseFloat(investmentMaxAmount) : null }),
      ...(savingsInterestRate !== undefined && { savingsInterestRate: savingsInterestRate ? parseFloat(savingsInterestRate) : null }),
    },
    update: {
      ...(maxDailyEarnings !== undefined && { maxDailyEarnings: maxDailyEarnings ? parseFloat(maxDailyEarnings) : null }),
      ...(maxSpendingPerDay !== undefined && { maxSpendingPerDay: maxSpendingPerDay ? parseFloat(maxSpendingPerDay) : null }),
      ...(investmentApproval !== undefined && { investmentApproval }),
      ...(investmentMaxAmount !== undefined && { investmentMaxAmount: investmentMaxAmount ? parseFloat(investmentMaxAmount) : null }),
      ...(savingsInterestRate !== undefined && { savingsInterestRate: savingsInterestRate ? parseFloat(savingsInterestRate) : null }),
    },
  });

  return NextResponse.json(settings);
}
