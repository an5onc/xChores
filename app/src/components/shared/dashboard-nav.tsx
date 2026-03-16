"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { NotificationBell } from "@/components/shared/notification-bell";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

// ── Nav structure ────────────────────────────────────────────────────────────

const parentNav = [
  {
    label: "Dashboard",
    href: "/parent",
    exact: true,
  },
  {
    label: "Chores",
    href: "/parent/chores",
  },
  {
    label: "Review",
    dropdown: [
      { label: "Approval", href: "/parent/review", icon: "✅" },
      { label: "Calendar", href: "/parent/calendar", icon: "📅" },
    ],
  },
  {
    label: "Ledger",
    href: "/parent/ledger",
    dropdown: [
      { label: "Ledger", href: "/parent/ledger", icon: "📒" },
      { label: "Store", href: "/parent/store", icon: "🛍️" },
      { label: "Bids", href: "/parent/bids", icon: "🏷️" },
      { label: "Investments", href: "/parent/investments", icon: "📈" },
    ],
  },
  {
    label: "Settings",
    dropdown: [
      { label: "Profile", href: "/parent/settings", icon: "👤" },
      { label: "Family", href: "/parent/family", icon: "👨‍👩‍👧‍👦" },
      { label: "Allowance", href: "/parent/allowance", icon: "💸" },
    ],
  },
];

// Kid nav stays simple — no dropdowns needed
const kidBottomLinks = [
  { href: "/kid", label: "Home", icon: "🏠", exact: true },
  { href: "/kid/chores", label: "Chores", icon: "📋" },
  { href: "/kid/wallet", label: "Wallet", icon: "💰" },
  { href: "/kid/savings", label: "Savings", icon: "🎯" },
  { href: "/kid/store", label: "Store", icon: "🛍️" },
  { href: "/kid/achievements", label: "Badges", icon: "🏅" },
];

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "PARENT" | "CHILD";
  familyId: string;
  avatarId: number;
}

interface DropdownItem {
  label: string;
  href: string;
  icon: string;
}

// ── Dropdown component ───────────────────────────────────────────────────────

function NavDropdown({
  label,
  items,
  topHref,
  isActive,
}: {
  label: string;
  items: DropdownItem[];
  topHref?: string;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }

  function onMouseLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-emerald-50 text-emerald-700"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {label}
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-700"
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main nav ─────────────────────────────────────────────────────────────────

export function DashboardNav({ user }: { user: DashboardUser }) {
  const pathname = usePathname();
  const isParent = user.role === "PARENT";
  const avatarEmoji = AVATARS[(user.avatarId || 1) - 1] || "👤";

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  function dropdownIsActive(items: DropdownItem[]) {
    return items.some((item) => pathname.startsWith(item.href));
  }

  return (
    <>
      {/* ── Top bar ── */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

          {/* Logo + links */}
          <div className="flex items-center gap-6">
            <Link
              href={isParent ? "/parent" : "/kid"}
              className="text-xl font-bold"
            >
              x<span className="text-emerald-600">Chores</span>
            </Link>

            {isParent && (
              <div className="hidden items-center gap-1 md:flex">
                {parentNav.map((item) => {
                  if (item.dropdown) {
                    return (
                      <NavDropdown
                        key={item.label}
                        label={item.label}
                        items={item.dropdown}
                        topHref={item.href}
                        isActive={dropdownIsActive(item.dropdown)}
                      />
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href!}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive(item.href!, item.exact)
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Kid desktop links */}
            {!isParent && (
              <div className="hidden items-center gap-1 md:flex">
                {kidBottomLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive(link.href, link.exact)
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right side — notifications, avatar, name, sign out */}
          <div className="flex items-center gap-3">
            <NotificationBell />
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

      {/* ── Mobile bottom tab bar ── */}
      {isParent ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-safe md:hidden">
          <div className="flex items-stretch justify-around">
            {/* Dashboard */}
            <Link
              href="/parent"
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
                pathname === "/parent" ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <span className="text-lg leading-none">📊</span>
              <span>Home</span>
            </Link>
            {/* Chores */}
            <Link
              href="/parent/chores"
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
                pathname.startsWith("/parent/chores") ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <span className="text-lg leading-none">📋</span>
              <span>Chores</span>
            </Link>
            {/* Review */}
            <Link
              href="/parent/review"
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
                pathname.startsWith("/parent/review") ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <span className="text-lg leading-none">✅</span>
              <span>Review</span>
            </Link>
            {/* Ledger */}
            <Link
              href="/parent/ledger"
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
                pathname.startsWith("/parent/ledger") ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <span className="text-lg leading-none">📒</span>
              <span>Ledger</span>
            </Link>
            {/* Settings */}
            <Link
              href="/parent/settings"
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
                pathname.startsWith("/parent/settings") ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <span className="text-lg leading-none">⚙️</span>
              <span>Settings</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-safe md:hidden">
          <div className="flex items-stretch justify-around">
            {kidBottomLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
                  isActive(link.href, link.exact) ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                <span className="text-lg leading-none">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
