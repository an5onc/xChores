"use client";

import { useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FadeIn,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  BounceOnTap,
  PinDot,
  Shake,
} from "@/components/shared/animations";

const AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐰", "🐸", "🐵",
  "🦄", "🐲", "🦋", "🐢", "🐬", "🦜", "🐶", "🐱",
];

type FamilyMember = {
  id: string;
  name: string;
  avatarId: number;
};

export default function KidLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"family" | "select" | "pin">("family");
  const [familyCode, setFamilyCode] = useState("");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedUser, setSelectedUser] = useState<FamilyMember | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  async function loadFamily(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/family/members?code=${familyCode}`);
      if (!res.ok) {
        setError("Family not found. Check your code!");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMembers(data.members);
      setStep("select");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function selectMember(member: FamilyMember) {
    setSelectedUser(member);
    setPin("");
    setError("");
    setShakeError(false);
    setStep("pin");
  }

  const submitPin = useCallback(async () => {
    if (pin.length !== 4 || !selectedUser) return;
    setLoading(true);
    setError("");

    const result = await signIn("kid-login", {
      userId: selectedUser.id,
      pin,
      redirect: false,
    });

    if (result?.error) {
      setError("Wrong PIN! Try again.");
      setShakeError(true);
      setPin("");
      setLoading(false);
      // Reset shake trigger after animation completes
      setTimeout(() => setShakeError(false), 500);
      return;
    }

    router.push("/kid");
  }, [pin, selectedUser, router]);

  function handlePinPress(digit: string) {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        // Auto-submit when 4 digits entered
        setTimeout(() => {
          // Access newPin directly since state may not have updated yet
          if (newPin.length === 4 && selectedUser) {
            setLoading(true);
            setError("");
            signIn("kid-login", {
              userId: selectedUser.id,
              pin: newPin,
              redirect: false,
            }).then((result) => {
              if (result?.error) {
                setError("Wrong PIN! Try again.");
                setShakeError(true);
                setPin("");
                setLoading(false);
                setTimeout(() => setShakeError(false), 500);
                return;
              }
              router.push("/kid");
            });
          }
        }, 100);
      }
    }
  }

  // Step 1: Enter family code
  if (step === "family") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-purple-50 to-pink-50 px-4">
        <FadeIn>
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl text-center">
            <ScaleIn>
              <div className="text-6xl">🏠</div>
            </ScaleIn>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Find Your Family
            </h1>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={loadFamily} className="mt-6">
              <input
                type="text"
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value)}
                placeholder="Enter family code"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-center text-lg font-mono text-gray-900 focus:border-sky-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !familyCode}
                className="mt-4 w-full rounded-xl bg-sky-500 py-4 text-lg font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
              >
                {loading ? "Looking..." : "Find My Family!"}
              </button>
            </form>

            <Link
              href="/login"
              className="mt-6 inline-block text-sm text-gray-500 hover:underline"
            >
              Parent login instead
            </Link>
          </div>
        </FadeIn>
      </main>
    );
  }

  // Step 2: Select your avatar
  if (step === "select") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-purple-50 to-pink-50 px-4">
        <FadeIn>
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl text-center">
            <h1 className="text-2xl font-bold text-gray-900">Who Are You?</h1>
            <p className="mt-2 text-gray-500">Tap your picture!</p>

            <StaggerContainer className="mt-6 grid grid-cols-2 gap-4">
              {members.map((member) => (
                <StaggerItem key={member.id}>
                  <BounceOnTap>
                    <button
                      onClick={() => selectMember(member)}
                      className="flex w-full flex-col items-center gap-2 rounded-2xl border-3 border-gray-200 p-6 transition hover:border-sky-400 hover:bg-sky-50"
                    >
                      <span className="text-5xl">
                        {AVATARS[member.avatarId - 1] || "🧒"}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {member.name}
                      </span>
                    </button>
                  </BounceOnTap>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <button
              onClick={() => setStep("family")}
              className="mt-6 text-sm text-gray-500 hover:underline"
            >
              Wrong family?
            </button>
          </div>
        </FadeIn>
      </main>
    );
  }

  // Step 3: Enter PIN
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-purple-50 to-pink-50 px-4">
      <FadeIn>
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl text-center">
          <ScaleIn>
            <span className="text-5xl inline-block">
              {AVATARS[(selectedUser?.avatarId ?? 1) - 1] || "🧒"}
            </span>
          </ScaleIn>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Hi, {selectedUser?.name}!
          </h1>
          <p className="mt-1 text-gray-500">Enter your secret PIN</p>

          {error && (
            <Shake trigger={shakeError}>
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            </Shake>
          )}

          {/* PIN dots */}
          <Shake trigger={shakeError}>
            <div className="mt-6 flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <PinDot
                  key={i}
                  filled={pin.length > i}
                  className="h-5 w-5 rounded-full"
                />
              ))}
            </div>
          </Shake>

          {/* Number pad */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map(
              (digit) => {
                if (digit === "") return <div key="empty" />;
                if (digit === "⌫") {
                  return (
                    <BounceOnTap key="back">
                      <button
                        onClick={() => setPin(pin.slice(0, -1))}
                        className="flex h-16 w-full items-center justify-center rounded-xl bg-gray-100 text-2xl transition hover:bg-gray-200"
                      >
                        ⌫
                      </button>
                    </BounceOnTap>
                  );
                }
                return (
                  <BounceOnTap key={digit}>
                    <button
                      onClick={() => handlePinPress(digit)}
                      disabled={loading}
                      className="flex h-16 w-full items-center justify-center rounded-xl bg-gray-100 text-2xl font-bold text-gray-900 transition hover:bg-sky-100 disabled:opacity-50"
                    >
                      {digit}
                    </button>
                  </BounceOnTap>
                );
              }
            )}
          </div>

          <button
            onClick={() => {
              setStep("select");
              setPin("");
              setError("");
              setShakeError(false);
            }}
            className="mt-6 text-sm text-gray-500 hover:underline"
          >
            Not you?
          </button>
        </div>
      </FadeIn>
    </main>
  );
}
