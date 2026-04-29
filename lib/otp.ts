import crypto from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "./db";
import { verification } from "./db/schema";

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function saveOtp(email: string, code: string) {
  await db.delete(verification).where(eq(verification.identifier, email));
  await db.insert(verification).values({
    id: crypto.randomUUID(),
    identifier: email,
    value: code,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<{ valid: boolean; reason?: "expired" | "invalid" }> {
  const records = await db
    .select()
    .from(verification)
    .where(
      and(
        eq(verification.identifier, email),
        gt(verification.expiresAt, new Date())
      )
    );

  if (records.length === 0) {
    return { valid: false, reason: "expired" };
  }

  const match = records.find((r) => r.value === code);
  if (!match) {
    return { valid: false, reason: "invalid" };
  }

  await db.delete(verification).where(eq(verification.id, match.id));
  return { valid: true };
}
