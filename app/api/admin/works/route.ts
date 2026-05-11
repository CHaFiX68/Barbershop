import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workPhoto, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().trim().min(1, "Підпис обов'язковий").max(100),
});

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
      .select({ max: sql<number | null>`max(${workPhoto.orderIndex})` })
      .from(workPhoto);
    const nextOrder = (max ?? -1) + 1;

    const id = crypto.randomUUID();
    await db.insert(workPhoto).values({
      id,
      imageUrl: parsed.data.imageUrl,
      caption: parsed.data.caption,
      orderIndex: nextOrder,
    });

    return NextResponse.json({
      ok: true,
      work: {
        id,
        imageUrl: parsed.data.imageUrl,
        caption: parsed.data.caption,
        orderIndex: nextOrder,
      },
    });
  } catch (err) {
    console.error("POST /api/admin/works error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
