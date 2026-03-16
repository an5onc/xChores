"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

const parentLinks = [
  { href: "/parent", label: "Dashboard", icon: "📊" },
  { href: "/parent/chores", label: "Chores", icon: "📋" },
  { href: "/parent/review", label: "Review", icon: "✅" },
  { href: "/parent/family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { href: "/parent/ledger", label: "Ledger", icon: "📒" },
  { href: "/parent/investments", label: "Invest", icon: "📈" },
];

const kidLinks = [
  { href: "/kid", label: "Home", icon: "🏠" },
  { href: "/kid/chores", label: "Chores", icon: "📋" },
  { href: "/kid/wallet", label: "Wallet", icon: "💰" },
  { href: "/kid/savings", label: "Savings", icon: "🎯" },
  { href: "/kid/investments", label: "Invest", icon: "🌱" },
  { href: "/kid/achievements", label: "Badges", icon: "🏅" },
];

interface DashboardUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "PARENT" | "CHILD";
  familyId: string;
  avatarId: number;
}

export function DashboardNav({ user }: { user: DashboardUser }) {
  const pathname = usePathname();
  const isParent = user.role === "PARENT";
  const links = isParent ? parentLinks : kidLinks;
  const avatarEmoji = AVATARS[(user.avatarId || 1) - 1] || "👤";

  function isActive(href: string) {
    if (href === "/parent" || href === "/kid") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Top bar */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href={isParent ? "/parent" : "/kid"} className="text-xl font-bold">
              x<span className="text-emerald-600">Chores</span>
            </Link>
            {/* Desktop nav links */}
            <div className="hidden gap-1 md:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive(link.href)
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl">{avatarEmoji}</span>
            <span className="hidden text-sm font-medium text-gray-700 sm:block">
              {user.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-safe md:hidden">
        <div className="flex items-stretch justify-around">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
                isActive(link.href)
                  ? "text-emerald-600"
                  : "text-gray-400"
              }`}
            >
              <span className="text-lg leading-none">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
