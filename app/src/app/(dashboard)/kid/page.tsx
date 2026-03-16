import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { KidDashboardContent } from "@/components/kid/kid-dashboard-content";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

export default async function KidDashboard() {
  const session = await auth();
  const userId = session!.user.id;
  const avatarId = session!.user.avatarId;

  const [wallet, activeChores, savingsGoals, investments] = await Promise.all([
    db.wallet.findUnique({ where: { userId } }),
    db.choreInstance.findMany({
      where: {
        OR: [
          { claimedById: userId, status: { in: ["CLAIMED", "IN_PROGRESS"] } },
          { status: "AVAILABLE", assignedToId: null },
          { status: "AVAILABLE", assignedToId: userId },
        ],
      },
      include: { chore: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.savingsGoal.findMany({
      where: { userId, isCompleted: false },
    }),
    db.investment.findMany({
      where: { userId, status: "ACTIVE" },
    }),
  ]);

  return (
    <KidDashboardContent
      userName={session!.user.name ?? "Kid"}
      avatarEmoji={AVATARS[avatarId - 1] || "🧒"}
      wallet={
        wallet
          ? {
              availableBalance: wallet.availableBalance,
              savedBalance: wallet.savedBalance,
              investedBalance: wallet.investedBalance,
            }
          : null
      }
      activeChores={activeChores.map((instance) => ({
        id: instance.id,
        chore: {
          title: instance.chore.title,
          dollarValue: instance.chore.dollarValue,
          difficulty: instance.chore.difficulty,
          estimatedMinutes: instance.chore.estimatedMinutes,
        },
      }))}
      savingsGoals={savingsGoals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
      }))}
      investments={investments.map((inv) => ({
        id: inv.id,
        principalAmount: inv.principalAmount,
        maturationDate: inv.maturationDate.toISOString(),
      }))}
    />
  );
}
