import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: List store items for the family
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const familyId = session.user.familyId;
  const isParent = session.user.role === "PARENT";

  const items = await db.storeItem.findMany({
    where: {
      familyId,
      ...(isParent ? {} : { isActive: true }),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

// POST: Create a store item (parent only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Only parents can add store items." }, { status: 403 });
  }

  const { name, description, price, imageUrl } = await req.json();

  if (!name || !price) {
    return NextResponse.json({ error: "Name and price required." }, { status: 400 });
  }

  const item = await db.storeItem.create({
    data: {
      familyId: session.user.familyId,
      name,
      description: description || null,
      price: parseFloat(price),
      imageUrl: imageUrl || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

// PATCH: Update a store item (parent only)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Only parents can update store items." }, { status: 403 });
  }

  const { itemId, name, description, price, imageUrl, isActive } = await req.json();

  if (!itemId) {
    return NextResponse.json({ error: "itemId required." }, { status: 400 });
  }

  const item = await db.storeItem.update({
    where: { id: itemId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(item);
}
