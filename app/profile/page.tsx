import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import ProfileContent from "./profile-content";

export const metadata = { title: "Профіль — BARBER&CO" };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/profile");
  }
  const createdAt =
    session.user.createdAt instanceof Date
      ? session.user.createdAt.toISOString()
      : String(session.user.createdAt);
  return (
    <main className="min-h-screen px-6 py-16">
      <ProfileContent
        name={session.user.name}
        email={session.user.email}
        createdAt={createdAt}
      />
    </main>
  );
}
