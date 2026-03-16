import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ParentDashboardClient from "@/components/parent/ParentDashboardClient";

export default async function ParentDashboard() {
  const session = await auth();
  const familyId = session!.user.familyId;

  const [family, pendingReview, todayInstances, children] = await Promise.all([
    db.family.findUnique({ where: { id: familyId } }),
    db.choreInstance.count({
      where: { chore: { familyId }, status: "SUBMITTED" },
    }),
    db.choreInstance.findMany({
      where: {
        chore: { familyId },
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      include: {
        chore: true,
        claimedBy: { select: { name: true, avatarId: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    db.user.findMany({
      where: { familyId, role: "CHILD" },
      include: { wallet: true },
    }),
  ]);

  // Serialize data for the client component (strip non-serializable fields)
  const serializedInstances = todayInstances.map((instance) => ({
    id: instance.id,
    status: instance.status,
    chore: {
      title: instance.chore.title,
      dollarValue: Number(instance.chore.dollarValue),
    },
    claimedBy: instance.claimedBy
      ? { name: instance.claimedBy.name, avatarId: instance.claimedBy.avatarId }
      : null,
  }));

  const serializedChildren = children.map((child) => ({
    id: child.id,
    name: child.name,
    wallet: child.wallet
      ? {
          availableBalance: Number(child.wallet.availableBalance),
          savedBalance: Number(child.wallet.savedBalance),
          investedBalance: Number(child.wallet.investedBalance),
        }
      : null,
  }));

  return (
    <ParentDashboardClient
      familyName={family?.name || "Family"}
      inviteCode={family?.inviteCode || ""}
      tvToken={family?.tvToken || ""}
      pendingReview={pendingReview}
      todayInstances={serializedInstances}
      children={serializedChildren}
    />
  );
}
