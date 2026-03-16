import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { KidChoresContent } from "@/components/kid/kid-chores-content";

export default async function KidChoresPage() {
  const session = await auth();
  if (!session?.user) return null;

  const familyId = session.user.familyId;
  const userId = session.user.id;

  const instances = await db.choreInstance.findMany({
    where: {
      chore: { familyId },
      OR: [
        { claimedById: userId },
        { assignedToId: userId },
        { status: "AVAILABLE", assignedToId: null },
      ],
    },
    include: {
      chore: true,
      claimedBy: { select: { id: true, name: true, avatarId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <KidChoresContent
      userId={userId}
      instances={instances.map((i) => ({
        id: i.id,
        status: i.status as "AVAILABLE" | "CLAIMED" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "REJECTED" | "REDO",
        startedAt: i.startedAt?.toISOString() ?? null,
        completedAt: i.completedAt?.toISOString() ?? null,
        timeSpentSeconds: i.timeSpentSeconds,
        claimedBy: i.claimedBy
          ? { id: i.claimedBy.id, name: i.claimedBy.name, avatarId: i.claimedBy.avatarId ?? null }
          : null,
        chore: {
          title: i.chore.title,
          description: i.chore.description,
          dollarValue: i.chore.dollarValue,
          estimatedMinutes: i.chore.estimatedMinutes,
          difficulty: i.chore.difficulty as "EASY" | "MEDIUM" | "HARD",
        },
      }))}
    />
  );
}
