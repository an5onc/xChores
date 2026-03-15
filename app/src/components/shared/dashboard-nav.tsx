"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

const parentLinks = [
  { href: "/parent", label: "Dashboard" },
  { href: "/parent/chores", label: "Chores" },
  { href: "/parent/review", label: "Review" },
  { href: "/parent/family", label: "Family" },
  { href: "/parent/ledger", label: "Ledger" },
  { href: "/parent/investments", label: "Investments" },
];

const kidLinks = [
  { href: "/kid", label: "Home" },
  { href: "/kid/chores", label: "Chores" },
  { href: "/kid/wallet", label: "Wallet" },
  { href: "/kid/savings", label: "Savings" },
  { href: "/kid/investments", label: "Investments" },
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
  const isParent = user.role === "PARENT";
  const links = isParent ? parentLinks : kidLinks;
  const avatarEmoji = AVATARS[(user.avatarId || 1) - 1] || "👤";

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href={isParent ? "/parent" : "/kid"} className="text-xl font-bold">
            x<span className="text-emerald-600">Chores</span>
          </Link>
          <div className="hidden gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
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

      {/* Mobile nav */}
      <div className="flex gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 sm:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
