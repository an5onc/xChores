import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReviewContent } from "@/components/parent/review-content";

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user) return null;

  const familyId = session.user.familyId;

  const instances = await db.choreInstance.findMany({
    where: {
      chore: { familyId },
      status: "SUBMITTED",
    },
    include: {
      chore: { select: { title: true, dollarValue: true } },
      claimedBy: { select: { name: true, avatarId: true } },
    },
    orderBy: { completedAt: "desc" },
  });

  return (
    <ReviewContent
      initialInstances={instances.map((i) => ({
        id: i.id,
        timeSpentSeconds: i.timeSpentSeconds,
        proofPhotoUrl: i.proofPhotoUrl,
        completedAt: i.completedAt?.toISOString() ?? "",
        chore: {
          title: i.chore.title,
          dollarValue: i.chore.dollarValue,
        },
        claimedBy: i.claimedBy
          ? { name: i.claimedBy.name, avatarId: i.claimedBy.avatarId ?? 1 }
          : null,
      }))}
    />
  );
}
