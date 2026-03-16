"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/animations";
import type { ChoreTemplatePack } from "@/lib/chore-templates";

export default function ChoreTemplatesPage() {
  const [packs, setPacks] = useState<ChoreTemplatePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPack, setExpandedPack] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/chores/templates")
      .then((r) => r.json())
      .then((data) => {
        setPacks(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  async function importPack(packId: string) {
    setImporting(packId);
    setSuccessMessage(null);

    const res = await fetch("/api/chores/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId }),
    });

    if (res.ok) {
      const data = await res.json();
      setSuccessMessage(
        `Imported ${data.imported} chores from "${data.packName}"!`
      );
    }
    setImporting(null);
  }

  const difficultyColor: Record<string, string> = {
    EASY: "bg-emerald-100 text-emerald-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    HARD: "bg-red-100 text-red-700",
  };

  const recurrenceLabel: Record<string, string> = {
    ONCE: "One-time",
    DAILY: "Daily",
    WEEKLY: "Weekly",
    MONTHLY: "Monthly",
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        Loading templates...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <Link
          href="/parent/chores"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Chores
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Chore Templates
        </h1>
        <p className="mt-1 text-gray-500">
          Pre-built age-appropriate chore packs. Import a pack to instantly
          create chores for your family.
        </p>
      </FadeIn>

      {/* Success Message */}
      {successMessage && (
        <FadeIn>
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-800">{successMessage}</p>
            <Link
              href="/parent/chores"
              className="mt-1 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              View your chores &rarr;
            </Link>
          </div>
        </FadeIn>
      )}

      {/* Template Packs */}
      <StaggerContainer className="space-y-4" delay={0.1}>
        {packs.map((pack) => {
          const isExpanded = expandedPack === pack.id;
          const isImporting = importing === pack.id;

          return (
            <StaggerItem key={pack.id}>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {/* Pack Header */}
                <div
                  className="flex cursor-pointer items-center justify-between p-5"
                  onClick={() =>
                    setExpandedPack(isExpanded ? null : pack.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{pack.emoji}</span>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {pack.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {pack.description}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                          Ages {pack.ageRange}
                        </span>
                        <span className="text-xs text-gray-400">
                          {pack.chores.length} chores
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        importPack(pack.id);
                      }}
                      disabled={isImporting}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                    >
                      {isImporting ? "Importing..." : "Import All"}
                    </button>
                    <span
                      className={`text-gray-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      &#9660;
                    </span>
                  </div>
                </div>

                {/* Expanded Chore List */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    <div className="space-y-2">
                      {pack.chores.map((chore, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl bg-white p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {chore.categoryIcon}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">
                                {chore.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {chore.description}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    difficultyColor[chore.difficulty]
                                  }`}
                                >
                                  {chore.difficulty}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {recurrenceLabel[chore.recurrence]}
                                </span>
                                <span className="text-xs text-gray-400">
                                  ~{chore.estimatedMinutes}min
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-emerald-600">
                            ${chore.dollarValue.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
