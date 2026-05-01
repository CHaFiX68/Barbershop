import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { contentBlock } from "./db/schema";

export async function getContent(
  key: string,
  defaultValue: string
): Promise<string> {
  try {
    const [row] = await db
      .select({ value: contentBlock.value })
      .from(contentBlock)
      .where(eq(contentBlock.key, key))
      .limit(1);
    return row?.value ?? defaultValue;
  } catch (err) {
    console.error(`getContent failed for key=${key}:`, err);
    return defaultValue;
  }
}

export async function getContentMap(
  defaults: Record<string, string>
): Promise<Record<string, string>> {
  try {
    const keys = Object.keys(defaults);
    if (keys.length === 0) return {};
    const rows = await db
      .select({ key: contentBlock.key, value: contentBlock.value })
      .from(contentBlock)
      .where(inArray(contentBlock.key, keys));

    const result: Record<string, string> = { ...defaults };
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  } catch (err) {
    console.error("getContentMap failed:", err);
    return { ...defaults };
  }
}
