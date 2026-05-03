import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "./index";
import { user } from "./schema";

/**
 * Returns the primary admin user id for support chat assignment.
 *
 * Strategy: pick the earliest-created admin (role === "admin") to keep
 * support routing stable. Hardcoding an email would tie us to one account
 * — using role + ORDER BY createdAt ASC lets future admin promotions
 * happen without code changes (the original first admin remains primary).
 *
 * Returns null if no admin exists in the system.
 */
export async function getPrimaryAdminUserId(): Promise<string | null> {
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, "admin"))
    .orderBy(asc(user.createdAt))
    .limit(1);
  return row?.id ?? null;
}
