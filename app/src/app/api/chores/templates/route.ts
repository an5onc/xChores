import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CHORE_TEMPLATE_PACKS } from "@/lib/chore-templates";

// GET: Return all template packs (no auth needed)
export async function GET() {
  return NextResponse.json(CHORE_TEMPLATE_PACKS);
}

// POST: Import a template pack (parents only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { packId } = await req.json();

  if (!packId) {
    return NextResponse.json(
      { error: "Pack ID is required." },
      { status: 400 }
    );
  }

  const pack = CHORE_TEMPLATE_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return NextResponse.json(
      { error: "Template pack not found." },
      { status: 404 }
    );
  }

  const familyId = session.user.familyId;
  const createdById = session.user.id;

  // Create all chores from the pack with their first instances
  const createdChores = await Promise.all(
    pack.chores.map(async (template) => {
      const chore = await db.chore.create({
        data: {
          familyId,
          createdById,
          title: template.title,
          description: template.description,
          dollarValue: template.dollarValue,
          estimatedMinutes: template.estimatedMinutes,
          difficulty: template.difficulty,
          recurrence: template.recurrence,
          categoryIcon: template.categoryIcon,
        },
      });

      // Create the first instance
      await db.choreInstance.create({
        data: {
          choreId: chore.id,
          status: "AVAILABLE",
        },
      });

      return chore;
    })
  );

  return NextResponse.json(
    { imported: createdChores.length, packName: pack.name },
    { status: 201 }
  );
}
