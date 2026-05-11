import { asc } from "drizzle-orm";
import { db } from "./db";
import { workPhoto } from "./db/schema";

export type WorkPhotoData = {
  id: string;
  imageUrl: string;
  caption: string | null;
  orderIndex: number;
};

export async function getWorkPhotos(): Promise<WorkPhotoData[]> {
  try {
    const rows = await db
      .select({
        id: workPhoto.id,
        imageUrl: workPhoto.imageUrl,
        caption: workPhoto.caption,
        orderIndex: workPhoto.orderIndex,
      })
      .from(workPhoto)
      .orderBy(asc(workPhoto.orderIndex), asc(workPhoto.createdAt));
    return rows;
  } catch (err) {
    console.error("getWorkPhotos failed:", err);
    return [];
  }
}
