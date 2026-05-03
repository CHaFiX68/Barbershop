import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [me] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id));
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [chatRow] = await db
    .select({ id: chat.id, type: chat.type, status: chat.status })
    .from(chat)
    .where(eq(chat.id, id));

  if (!chatRow) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }
  if (chatRow.type !== "support") {
    // Booking chats are archived via cancel booking endpoint, not here.
    return NextResponse.json(
      { error: "Можна архівувати лише support-тікети" },
      { status: 400 }
    );
  }
  if (chatRow.status !== "active") {
    return NextResponse.json(
      { error: "Already archived" },
      { status: 400 }
    );
  }

  await db
    .update(chat)
    .set({ status: "archived", archivedAt: new Date() })
    .where(eq(chat.id, id));

  return NextResponse.json({ ok: true });
}
