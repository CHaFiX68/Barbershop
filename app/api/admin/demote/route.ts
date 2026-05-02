import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfile, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({ userId: z.string().min(1) });

export async function POST(request: Request) {
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

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const [target] = await db
      .select()
      .from(user)
      .where(eq(user.id, parsed.data.userId));
    if (!target) {
      return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
    }
    if (target.id === session.user.id) {
      return NextResponse.json(
        { error: "Не можна розжалувати себе" },
        { status: 400 }
      );
    }
    if (target.role === "admin") {
      return NextResponse.json(
        { error: "Не можна керувати ролями інших адмінів" },
        { status: 400 }
      );
    }
    if (target.role !== "barber") {
      return NextResponse.json(
        { error: "Користувач не є барбером" },
        { status: 400 }
      );
    }

    await db
      .update(user)
      .set({ role: "user", updatedAt: new Date() })
      .where(eq(user.id, target.id));

    await db
      .update(barberProfile)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(barberProfile.userId, target.id));

    revalidatePath("/");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/demote error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
