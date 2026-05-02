import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { heroSlide, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [currentUser] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id));
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await db.delete(heroSlide).where(eq(heroSlide.id, id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/hero/slides/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
