import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const role = session.user.role;
    redirect(role === "PARENT" ? "/parent" : "/kid");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h1 className="text-6xl font-bold tracking-tight text-gray-900">
          x<span className="text-emerald-600">Chores</span>
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Teach your kids the value of money through real work, smart saving, and
          investing.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="rounded-xl bg-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-700"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-xl border-2 border-gray-300 px-8 py-4 text-lg font-semibold text-gray-700 transition hover:border-emerald-600 hover:text-emerald-600"
          >
            Parent Login
          </Link>
          <Link
            href="/kid-login"
            className="rounded-xl bg-sky-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-sky-600"
          >
            Kid Login
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <div className="text-4xl">💰</div>
            <h3 className="mt-3 text-lg font-bold text-gray-900">
              Earn &amp; Learn
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Complete chores to earn real dollar values based on effort and
              time.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <div className="text-4xl">🏦</div>
            <h3 className="mt-3 text-lg font-bold text-gray-900">
              Save &amp; Grow
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Set savings goals, invest for bigger returns, and watch your money
              grow.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <div className="text-4xl">🏆</div>
            <h3 className="mt-3 text-lg font-bold text-gray-900">
              Track &amp; Celebrate
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Real-time progress for the whole family. Every effort counts.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
