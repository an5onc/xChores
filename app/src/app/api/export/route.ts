import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Export data as CSV or JSON
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const familyId = session.user.familyId;
  const format = req.nextUrl.searchParams.get("format") || "json";
  const type = req.nextUrl.searchParams.get("type") || "transactions";

  if (type === "transactions") {
    const transactions = await db.transaction.findMany({
      where: { wallet: { user: { familyId } } },
      include: {
        wallet: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      const header = "Date,User,Type,Amount,Description\n";
      const rows = transactions
        .map(
          (t: typeof transactions[number]) =>
            `${t.createdAt.toISOString()},${t.wallet.user.name},${t.type},${t.amount},"${t.description}"`
        )
        .join("\n");

      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="xchores-transactions-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(transactions);
  }

  if (type === "chores") {
    const instances = await db.choreInstance.findMany({
      where: { chore: { familyId } },
      include: {
        chore: true,
        claimedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      const header = "Date,Chore,AssignedTo,Status,TimeSpent(s),Value\n";
      const rows = instances
        .map(
          (i: typeof instances[number]) =>
            `${i.createdAt.toISOString()},"${i.chore.title}",${i.claimedBy?.name || "Unclaimed"},${i.status},${i.timeSpentSeconds || 0},${i.chore.dollarValue}`
        )
        .join("\n");

      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="xchores-chores-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(instances);
  }

  return NextResponse.json({ error: "Invalid export type." }, { status: 400 });
}
