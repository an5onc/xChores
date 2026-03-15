import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: List chores for the family
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const familyId = session.user.familyId;
  const role = session.user.role;

  const chores = await db.chore.findMany({
    where: { familyId, isActive: true },
    include: {
      instances: {
        where: {
          status: { in: ["AVAILABLE", "CLAIMED", "IN_PROGRESS", "SUBMITTED"] },
        },
        include: { claimedBy: { select: { id: true, name: true, avatarId: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Kids only see chores assigned to them or open pool
  if (role === "CHILD") {
    const userId = session.user.id;
    return NextResponse.json(
      chores.filter((c: typeof chores[number]) => !c.assignedToId || c.assignedToId === userId)
    );
  }

  return NextResponse.json(chores);
}

// POST: Create a new chore (parents only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const familyId = session.user.familyId;
  const body = await req.json();

  const {
    title,
    description,
    dollarValue,
    estimatedMinutes,
    difficulty,
    recurrence,
    recurrenceRule,
    assignedToId,
    categoryIcon,
  } = body;

  if (!title || dollarValue === undefined) {
    return NextResponse.json(
      { error: "Title and dollar value required." },
      { status: 400 }
    );
  }

  const chore = await db.chore.create({
    data: {
      familyId,
      createdById: session.user.id,
      title,
      description: description || null,
      dollarValue: parseFloat(dollarValue),
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
      difficulty: difficulty || "MEDIUM",
      recurrence: recurrence || "ONCE",
      recurrenceRule: recurrenceRule || null,
      assignedToId: assignedToId || null,
      categoryIcon: categoryIcon || null,
    },
  });

  // Create the first instance
  await db.choreInstance.create({
    data: {
      choreId: chore.id,
      assignedToId: assignedToId || null,
      status: "AVAILABLE",
    },
  });

  return NextResponse.json(chore, { status: 201 });
}
