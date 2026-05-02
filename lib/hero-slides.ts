import { asc } from "drizzle-orm";
import { db } from "./db";
import { heroSlide } from "./db/schema";

export type HeroSlideData = {
  id: string;
  imageUrl: string;
  orderIndex: number;
};

export async function getHeroSlides(): Promise<HeroSlideData[]> {
  try {
    const rows = await db
      .select({
        id: heroSlide.id,
        imageUrl: heroSlide.imageUrl,
        orderIndex: heroSlide.orderIndex,
      })
      .from(heroSlide)
      .orderBy(asc(heroSlide.orderIndex), asc(heroSlide.createdAt));
    return rows;
  } catch (err) {
    console.error("getHeroSlides failed:", err);
    return [];
  }
}
