"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/animations";

type ChoreInstance = {
  id: string;
  status: string;
  chore: { title: string; dollarValue: number };
  claimedBy: { name: string; avatarId: number } | null;
};

type ChildWithWallet = {
  id: string;
  name: string;
  wallet: {
    availableBalance: number;
    savedBalance: number;
    investedBalance: number;
  } | null;
};

interface ParentDashboardClientProps {
  familyName: string;
  inviteCode: string;
  tvToken: string;
  pendingReview: number;
  todayInstances: ChoreInstance[];
  children: ChildWithWallet[];
}

export default function ParentDashboardClient({
  familyName,
  inviteCode,
  tvToken,
  pendingReview,
  todayInstances,
  children,
}: ParentDashboardClientProps) {
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  async function handleGenerateChores() {
    setGenerating(true);
    setGenerateMsg(null);

    try {
      const res = await fetch("/api/chores/generate", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setGenerateMsg({ text: data.error || "Something went wrong.", isError: true });
      } else {
        setGenerateMsg({ text: data.message, isError: false });
      }
    } catch {
      setGenerateMsg({ text: "Network error. Please try again.", isError: true });
    } finally {
      setGenerating(false);
      setTimeout(() => setGenerateMsg(null), 5000);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {familyName} Dashboard
            </h1>
            <p className="mt-1 text-gray-500">
              Family code:{" "}
              <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                {inviteCode}
              </code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={handleGenerateChores}
                disabled={generating}
                className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                {generating ? "Generating\u2026" : "Generate Today\u2019s Chores"}
              </button>
              {generateMsg && (
                <div
                  className={`absolute right-0 top-full z-10 mt-2 w-72 rounded-lg p-3 text-sm shadow-lg ${
                    generateMsg.isError
                      ? "bg-red-50 text-red-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {generateMsg.text}
                </div>
              )}
            </div>
            <Link
              href="/parent/chores"
              className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              + New Chore
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-3" delay={0.1}>
        <StaggerItem>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Pending Review</p>
            <p className="mt-2 text-4xl font-bold text-orange-500">
              {pendingReview}
            </p>
            {pendingReview > 0 && (
              <Link
                href="/parent/review"
                className="mt-2 inline-block text-sm text-orange-600 hover:underline"
              >
                Review now
              </Link>
            )}
          </div>
        </StaggerItem>

        {children.map((child) => (
          <StaggerItem key={child.id}>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">{child.name}</p>
              <p className="mt-2 text-4xl font-bold text-emerald-600">
                ${child.wallet?.availableBalance.toFixed(2) || "0.00"}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Saved: ${child.wallet?.savedBalance.toFixed(2) || "0.00"} |
                Invested: ${child.wallet?.investedBalance.toFixed(2) || "0.00"}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Today's Activity */}
      <FadeIn delay={0.25}>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Today&apos;s Activity
          </h2>
          {todayInstances.length === 0 ? (
            <p className="mt-4 text-gray-500">No activity yet today.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {todayInstances.map((instance) => (
                <div
                  key={instance.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {instance.chore.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {instance.claimedBy?.name || "Unclaimed"} &middot; $
                      {instance.chore.dollarValue.toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      instance.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : instance.status === "SUBMITTED"
                          ? "bg-orange-100 text-orange-700"
                          : instance.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {instance.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      {/* TV Dashboard Link */}
      <FadeIn delay={0.35}>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">TV Dashboard URL:</p>
          <code className="mt-1 block font-mono text-sm text-gray-700">
            /tv/{tvToken}
          </code>
          <p className="mt-2 text-xs text-gray-400">
            Open this URL on a TV or external screen for a live family dashboard.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
