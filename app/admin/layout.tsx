import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminNav from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/support");
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
