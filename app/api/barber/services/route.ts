import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { service, user } from "@/lib/db/schema";

const MAX_SERVICES = 6;

async function checkBarber(userId: string): Promise<boolean> {
  const [currentUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId));
  if (
    !currentUser ||
    (currentUser.role !== "barber" && currentUser.role !== "admin")
  ) {
    return false;
  }
  return true;
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  price: z.string().trim().min(1).max(40),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await checkBarber(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [{ value: currentCount }] = await db
      .select({ value: count() })
      .from(service)
      .where(eq(service.barberUserId, session.user.id));

    if (currentCount >= MAX_SERVICES) {
      return NextResponse.json(
        { error: `Максимум ${MAX_SERVICES} послуг` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const newId = crypto.randomUUID();
    await db.insert(service).values({
      id: newId,
      barberUserId: session.user.id,
      name: parsed.data.name,
      price: parsed.data.price,
      orderIndex: currentCount,
    });

    return NextResponse.json({ ok: true, id: newId });
  } catch (err) {
    console.error("POST /api/barber/services error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(80).optional(),
  price: z.string().trim().min(1).max(40).optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await checkBarber(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(service)
      .where(
        and(
          eq(service.id, parsed.data.id),
          eq(service.barberUserId, session.user.id)
        )
      );
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.price !== undefined) updates.price = parsed.data.price;

    await db
      .update(service)
      .set(updates)
      .where(eq(service.id, parsed.data.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/barber/services error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await checkBarber(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { id?: unknown };
    const id = typeof body.id === "string" ? body.id : null;
    if (!id) {
      return NextResponse.json({ error: "No id" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(service)
      .where(
        and(eq(service.id, id), eq(service.barberUserId, session.user.id))
      );
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.delete(service).where(eq(service.id, id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/barber/services error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
