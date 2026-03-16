import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Return notifications for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

// PATCH: Mark notification(s) as read
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json();
  const { notificationId, markAllRead } = body;

  if (markAllRead) {
    await db.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  if (notificationId) {
    await db.notification.updateMany({
      where: { id: notificationId, userId: session.user.id },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "notificationId or markAllRead required." },
    { status: 400 },
  );
}
