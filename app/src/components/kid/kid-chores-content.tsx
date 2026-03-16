"use client";

import { useState } from "react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/animations";
import { ChoreCard, type ChoreInstanceData } from "@/components/kid/chore-card";

interface KidChoresContentProps {
  userId: string;
  instances: ChoreInstanceData[];
}

export function KidChoresContent({ userId, instances: initial }: KidChoresContentProps) {
  const [instances, setInstances] = useState(initial);

  function handleUpdate(updated: ChoreInstanceData) {
    setInstances((prev) =>
      prev.map((i) => (i.id === updated.id ? updated : i)),
    );
  }

  const available = instances.filter((i) => i.status === "AVAILABLE");
  const active = instances.filter((i) =>
    ["CLAIMED", "IN_PROGRESS"].includes(i.status),
  );
  const submitted = instances.filter((i) => i.status === "SUBMITTED");
  const redo = instances.filter((i) => i.status === "REDO");

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold text-gray-900">My Chores</h1>
      </FadeIn>

      {/* Redo Requested */}
      {redo.length > 0 && (
        <FadeIn delay={0.05}>
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-amber-600">Redo Requested</h2>
            <StaggerContainer className="space-y-3">
              {redo.map((instance) => (
                <StaggerItem key={instance.id}>
                  <ChoreCard
                    instance={instance}
                    userId={userId}
                    onUpdate={handleUpdate}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </FadeIn>
      )}

      {/* Active / In Progress */}
      {active.length > 0 && (
        <FadeIn delay={0.1}>
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-sky-600">In Progress</h2>
            <StaggerContainer className="space-y-3">
              {active.map((instance) => (
                <StaggerItem key={instance.id}>
                  <ChoreCard
                    instance={instance}
                    userId={userId}
                    onUpdate={handleUpdate}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </FadeIn>
      )}

      {/* Submitted / Waiting */}
      {submitted.length > 0 && (
        <FadeIn delay={0.15}>
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-orange-600">Waiting for Approval</h2>
            <StaggerContainer className="space-y-3">
              {submitted.map((instance) => (
                <StaggerItem key={instance.id}>
                  <ChoreCard
                    instance={instance}
                    userId={userId}
                    onUpdate={handleUpdate}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </FadeIn>
      )}

      {/* Available */}
      <FadeIn delay={0.2}>
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-emerald-600">Available Chores</h2>
          {available.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-4xl">🎉</p>
              <p className="mt-2 text-lg text-gray-500">
                No chores available right now!
              </p>
            </div>
          ) : (
            <StaggerContainer className="space-y-3" delay={0.25}>
              {available.map((instance) => (
                <StaggerItem key={instance.id}>
                  <ChoreCard
                    instance={instance}
                    userId={userId}
                    onUpdate={handleUpdate}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
