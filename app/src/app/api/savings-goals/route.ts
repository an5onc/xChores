import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: List savings goals for current user
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const role = session.user.role;
  const familyId = session.user.familyId;

  // Parents see all kids' goals, kids see their own
  const goals =
    role === "PARENT"
      ? await db.savingsGoal.findMany({
          where: { user: { familyId } },
          include: { user: { select: { id: true, name: true, avatarId: true } } },
          orderBy: { createdAt: "desc" },
        })
      : await db.savingsGoal.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        });

  return NextResponse.json(goals);
}

// POST: Create a savings goal
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { name, targetAmount, imageUrl, parentMatchRate } = await req.json();

  if (!name || !targetAmount) {
    return NextResponse.json(
      { error: "Name and target amount required." },
      { status: 400 }
    );
  }

  // Limit to 3 active goals per child
  const activeGoals = await db.savingsGoal.count({
    where: { userId: session.user.id, isCompleted: false },
  });

  if (activeGoals >= 3) {
    return NextResponse.json(
      { error: "Maximum 3 active savings goals." },
      { status: 400 }
    );
  }

  const goal = await db.savingsGoal.create({
    data: {
      userId: session.user.id,
      name,
      targetAmount: parseFloat(targetAmount),
      imageUrl: imageUrl || null,
      parentMatchRate: parentMatchRate ? parseFloat(parentMatchRate) : null,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
