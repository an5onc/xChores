import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateChoreInstances } from "@/lib/generate-chores";

// POST: Generate recurring chore instances for today (parents only)
export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "PARENT") {
    return NextResponse.json(
      { error: "Only parents can generate chore instances." },
      { status: 403 }
    );
  }

  const familyId = session.user.familyId;

  try {
    const count = await generateChoreInstances(familyId);

    return NextResponse.json({
      success: true,
      generated: count,
      message:
        count === 0
          ? "All recurring chores already have instances for this period."
          : `Generated ${count} chore instance${count === 1 ? "" : "s"}.`,
    });
  } catch (error) {
    console.error("Failed to generate chore instances:", error);
    return NextResponse.json(
      { error: "Failed to generate chore instances." },
      { status: 500 }
    );
  }
}
