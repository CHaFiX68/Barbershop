import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { heroSlide, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({ imageUrl: z.string().url() });

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

    const [{ max }] = await db
      .select({ max: sql<number | null>`max(${heroSlide.orderIndex})` })
      .from(heroSlide);
    const nextOrder = (max ?? -1) + 1;

    const id = crypto.randomUUID();
    await db.insert(heroSlide).values({
      id,
      imageUrl: parsed.data.imageUrl,
      orderIndex: nextOrder,
    });

    return NextResponse.json({
      ok: true,
      slide: { id, imageUrl: parsed.data.imageUrl, orderIndex: nextOrder },
    });
  } catch (err) {
    console.error("POST /api/admin/hero/slides error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
