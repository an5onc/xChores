import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {family?.name || "Family"} Dashboard
          </h1>
          <p className="mt-1 text-gray-500">
            Family code: <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">{family?.inviteCode}</code>
          </p>
        </div>
        <Link
          href="/parent/chores"
          className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          + New Chore
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pending Review</p>
          <p className="mt-2 text-4xl font-bold text-orange-500">{pendingReview}</p>
          {pendingReview > 0 && (
            <Link href="/parent/review" className="mt-2 inline-block text-sm text-orange-600 hover:underline">
              Review now
            </Link>
          )}
        </div>

        {children.map((child: typeof children[number]) => (
          <div key={child.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{child.name}</p>
            <p className="mt-2 text-4xl font-bold text-emerald-600">
              ${child.wallet?.availableBalance.toFixed(2) || "0.00"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Saved: ${child.wallet?.savedBalance.toFixed(2) || "0.00"} |
              Invested: ${child.wallet?.investedBalance.toFixed(2) || "0.00"}
            </p>
          </div>
        ))}
      </div>

      {/* Today's Activity */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Today&apos;s Activity</h2>
        {todayInstances.length === 0 ? (
          <p className="mt-4 text-gray-500">No activity yet today.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {todayInstances.map((instance: typeof todayInstances[number]) => (
              <div
                key={instance.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{instance.chore.title}</p>
                  <p className="text-sm text-gray-500">
                    {instance.claimedBy?.name || "Unclaimed"} &middot; ${instance.chore.dollarValue.toFixed(2)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    instance.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : instance.status === "SUBMITTED"
                        ? "bg-orange-100 text-orange-700"
                        : instance.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {instance.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TV Dashboard Link */}
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">TV Dashboard URL:</p>
        <code className="mt-1 block font-mono text-sm text-gray-700">
          /tv/{family?.tvToken}
        </code>
        <p className="mt-2 text-xs text-gray-400">
          Open this URL on a TV or external screen for a live family dashboard.
        </p>
      </div>
    </div>
  );
}
