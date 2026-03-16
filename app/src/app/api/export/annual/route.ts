import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET: Export annual earnings summary as JSON or CSV.
 * Query params: ?year=2026&format=csv|json
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const format = searchParams.get("format") || "json";

  const familyId = session.user.familyId;
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const kids = await db.user.findMany({
    where: { familyId, role: "CHILD" },
    select: { id: true, name: true },
  });

  const kidReports = await Promise.all(
    kids.map(async (kid) => {
      const transactions = await db.transaction.findMany({
        where: {
          wallet: { userId: kid.id },
          createdAt: { gte: startDate, lt: endDate },
        },
        orderBy: { createdAt: "asc" },
      });

      const totalEarnings = transactions
        .filter((t) => t.type === "EARNING")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalBonuses = transactions
        .filter((t) => t.type === "BONUS")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalSaved = transactions
        .filter((t) => t.type === "SAVING")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalSpent = transactions
        .filter((t) => t.type === "SPENDING")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalInvested = transactions
        .filter((t) => t.type === "INVESTMENT")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalMatured = transactions
        .filter((t) => t.type === "MATURATION")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalMatched = transactions
        .filter((t) => t.type === "MATCH")
        .reduce((sum, t) => sum + t.amount, 0);

      const choresCompleted = await db.choreInstance.count({
        where: {
          claimedById: kid.id,
          status: "APPROVED",
          completedAt: { gte: startDate, lt: endDate },
        },
      });

      return {
        name: kid.name,
        choresCompleted,
        totalEarnings,
        totalBonuses,
        totalSaved,
        totalSpent,
        totalInvested,
        totalMatured,
        totalMatched,
        netEarnings: totalEarnings + totalBonuses + totalMatured + totalMatched,
        transactions: transactions.map((t) => ({
          date: t.createdAt.toISOString().split("T")[0],
          type: t.type,
          amount: t.amount,
          description: t.description,
        })),
      };
    })
  );

  if (format === "csv") {
    // Build CSV
    const lines: string[] = [
      "Child,Date,Type,Amount,Description",
    ];

    for (const kid of kidReports) {
      for (const t of kid.transactions) {
        lines.push(
          `"${kid.name}","${t.date}","${t.type}","${t.amount.toFixed(2)}","${t.description.replace(/"/g, '""')}"`
        );
      }
    }

    // Summary section
    lines.push("");
    lines.push("--- ANNUAL SUMMARY ---");
    lines.push("Child,Chores Completed,Earnings,Bonuses,Saved,Spent,Invested,Matured,Matched,Net Total");
    for (const kid of kidReports) {
      lines.push(
        `"${kid.name}",${kid.choresCompleted},${kid.totalEarnings.toFixed(2)},${kid.totalBonuses.toFixed(2)},${kid.totalSaved.toFixed(2)},${kid.totalSpent.toFixed(2)},${kid.totalInvested.toFixed(2)},${kid.totalMatured.toFixed(2)},${kid.totalMatched.toFixed(2)},${kid.netEarnings.toFixed(2)}`
      );
    }

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="xchores-annual-${year}.csv"`,
      },
    });
  }

  return NextResponse.json({
    year,
    family: familyId,
    kids: kidReports.map(({ transactions: _t, ...rest }) => rest),
  });
}
