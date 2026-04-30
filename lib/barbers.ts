import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { barberProfile, service, user } from "./db/schema";

export interface BarberPublic {
  id: string;
  name: string;
  bio: string;
  landingImage: string | null;
  initials: string;
  services: { name: string; price: string }[];
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export async function getBarbers(): Promise<BarberPublic[]> {
  try {
    const rows = await db
      .select({
        userId: user.id,
        name: user.name,
        bio: barberProfile.bio,
        landingImage: barberProfile.landingImage,
      })
      .from(user)
      .innerJoin(barberProfile, eq(barberProfile.userId, user.id))
      .where(
        and(
          inArray(user.role, ["barber", "admin"]),
          eq(barberProfile.isActive, true)
        )
      );

    const result: BarberPublic[] = [];
    for (const row of rows) {
      if (!row.bio) continue;
      const services = await db
        .select({ name: service.name, price: service.price })
        .from(service)
        .where(eq(service.barberUserId, row.userId))
        .orderBy(asc(service.orderIndex));
      if (services.length === 0) continue;

      result.push({
        id: row.userId,
        name: row.name,
        bio: row.bio,
        landingImage: row.landingImage,
        initials: getInitials(row.name),
        services,
      });
    }
    return result;
  } catch (err) {
    console.error("getBarbers failed:", err);
    return [];
  }
}
