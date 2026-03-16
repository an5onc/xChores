import { db } from "@/lib/db";

type NotificationType =
  | "chore_submitted"
  | "chore_approved"
  | "chore_rejected"
  | "chore_redo"
  | "achievement_unlocked"
  | "investment_matured"
  | "savings_match"
  | "streak";

export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  return db.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

/** Notify all parents in a family */
export async function notifyParents(
  familyId: string,
  opts: {
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  },
) {
  const parents = await db.user.findMany({
    where: { familyId, role: "PARENT" },
    select: { id: true },
  });
  await Promise.all(
    parents.map((p) => createNotification({ userId: p.id, ...opts })),
  );
}
