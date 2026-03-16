import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateStreak } from "@/lib/streaks";

const MILESTONES = [3, 7, 14, 30, 60, 100];

const MILESTONE_BONUSES: Record<number, number> = {
  3: 0.5,
  7: 1.0,
  14: 2.5,
  30: 5.0,
  60: 10.0,
  100: 25.0,
};

// GET: Calculate and return the current streak for the authenticated user
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { currentStreak } = await updateStreak(session.user.id);

  // Find the next milestone the user hasn't reached yet
  const nextMilestone = MILESTONES.find((m) => m > currentStreak) ?? 0;
  const nextMilestoneBonus = MILESTONE_BONUSES[nextMilestone] ?? 0;

  return NextResponse.json({
    currentStreak,
    nextMilestone,
    nextMilestoneBonus,
  });
}
