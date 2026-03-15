import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, familyName, email, password } = await req.json();

    if (!name || !familyName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    // Create family and parent user in a transaction
    const family = await db.family.create({
      data: {
        name: familyName,
        members: {
          create: {
            name,
            email,
            passwordHash,
            role: "PARENT",
            wallet: { create: {} },
          },
        },
      },
      include: { members: true },
    });

    return NextResponse.json(
      {
        familyId: family.id,
        inviteCode: family.inviteCode,
        userId: family.members[0].id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
