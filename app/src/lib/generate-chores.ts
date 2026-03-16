import { db } from "@/lib/db";

/**
 * Generate chore instances for recurring chores belonging to a family.
 *
 * Idempotent: safe to call multiple times per day. It checks for existing
 * instances in the relevant time window before creating new ones.
 *
 * - DAILY chores: creates an instance if none exists for today (UTC day)
 * - WEEKLY chores: creates an instance if none exists for the current
 *   ISO week (Monday through Sunday)
 * - MONTHLY chores: creates an instance if none exists for the current month
 * - ONCE / CUSTOM chores: skipped
 */
export async function generateChoreInstances(familyId: string): Promise<number> {
  const now = new Date();

  // Boundaries for "today" (start of day UTC)
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  // Boundaries for "this week" (ISO week: Monday-Sunday)
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset)
  );
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  // Boundaries for "this month"
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const monthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );

  // End-of-week date for weekly due dates (Sunday 23:59:59)
  const endOfWeek = new Date(weekEnd);
  endOfWeek.setUTCMilliseconds(endOfWeek.getUTCMilliseconds() - 1);

  // End-of-month date for monthly due dates
  const endOfMonth = new Date(monthEnd);
  endOfMonth.setUTCMilliseconds(endOfMonth.getUTCMilliseconds() - 1);

  // Fetch all active recurring chores for this family
  const recurringChores = await db.chore.findMany({
    where: {
      familyId,
      isActive: true,
      recurrence: { in: ["DAILY", "WEEKLY", "MONTHLY"] },
    },
    select: {
      id: true,
      recurrence: true,
      assignedToId: true,
    },
  });

  if (recurringChores.length === 0) {
    return 0;
  }

  const choreIds = recurringChores.map((c) => c.id);

  // Fetch existing instances for these chores within their respective windows.
  // We query the broadest window (month start) to cover all recurrence types.
  const existingInstances = await db.choreInstance.findMany({
    where: {
      choreId: { in: choreIds },
      createdAt: { gte: monthStart, lt: monthEnd },
    },
    select: {
      choreId: true,
      createdAt: true,
    },
  });

  // Build a lookup: choreId -> list of instance creation timestamps
  const instanceMap = new Map<string, Date[]>();
  for (const inst of existingInstances) {
    const list = instanceMap.get(inst.choreId) || [];
    list.push(inst.createdAt);
    instanceMap.set(inst.choreId, list);
  }

  // Determine which chores need a new instance
  const toCreate: Array<{
    choreId: string;
    assignedToId: string | null;
    dueDate: Date;
  }> = [];

  for (const chore of recurringChores) {
    const existing = instanceMap.get(chore.id) || [];

    if (chore.recurrence === "DAILY") {
      const hasToday = existing.some(
        (d) => d >= todayStart && d < todayEnd
      );
      if (!hasToday) {
        toCreate.push({
          choreId: chore.id,
          assignedToId: chore.assignedToId,
          dueDate: todayEnd, // due by end of today
        });
      }
    } else if (chore.recurrence === "WEEKLY") {
      const hasThisWeek = existing.some(
        (d) => d >= weekStart && d < weekEnd
      );
      if (!hasThisWeek) {
        toCreate.push({
          choreId: chore.id,
          assignedToId: chore.assignedToId,
          dueDate: endOfWeek,
        });
      }
    } else if (chore.recurrence === "MONTHLY") {
      const hasThisMonth = existing.some(
        (d) => d >= monthStart && d < monthEnd
      );
      if (!hasThisMonth) {
        toCreate.push({
          choreId: chore.id,
          assignedToId: chore.assignedToId,
          dueDate: endOfMonth,
        });
      }
    }
  }

  if (toCreate.length === 0) {
    return 0;
  }

  // Batch-create all instances
  const result = await db.choreInstance.createMany({
    data: toCreate.map((item) => ({
      choreId: item.choreId,
      assignedToId: item.assignedToId,
      status: "AVAILABLE" as const,
      dueDate: item.dueDate,
    })),
  });

  return result.count;
}
