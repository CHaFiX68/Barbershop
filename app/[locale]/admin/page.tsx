import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminIndexPage() {
  // /admin → /admin/support (only meaningful admin page right now)
  redirect("/admin/support");
}
