import { cookies } from "next/headers";

export type Theme = "light" | "dark";

export async function getTheme(): Promise<Theme> {
  const c = await cookies();
  return c.get("theme")?.value === "dark" ? "dark" : "light";
}
