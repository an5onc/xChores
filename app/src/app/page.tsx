import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingContent } from "@/components/shared/landing-content";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const role = session.user.role;
    redirect(role === "PARENT" ? "/parent" : "/kid");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <LandingContent />
    </main>
  );
}
