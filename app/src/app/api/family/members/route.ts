import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: List family members (for kid login by invite code)
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Family code required." }, { status: 400 });
  }

  const family = await db.family.findUnique({
    where: { inviteCode: code },
    include: {
      members: {
        where: { role: "CHILD" },
        select: { id: true, name: true, avatarId: true },
      },
    },
  });

  if (!family) {
    return NextResponse.json({ error: "Family not found." }, { status: 404 });
  }

  return NextResponse.json({ familyName: family.name, members: family.members });
}

// POST: Add a child to the family
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { name, age, avatarId, pin } = await req.json();
  const familyId = session.user.familyId;

  if (!name || !pin || pin.length !== 4) {
    return NextResponse.json(
      { error: "Name and 4-digit PIN required." },
      { status: 400 }
    );
  }

  const hashedPin = await hash(pin, 12);

  const child = await db.user.create({
    data: {
      familyId,
      name,
      age: age ? parseInt(age) : null,
      avatarId: avatarId || 1,
      pin: hashedPin,
      role: "CHILD",
      wallet: { create: {} },
    },
  });

  return NextResponse.json(
    { id: child.id, name: child.name, avatarId: child.avatarId },
    { status: 201 }
  );
}
