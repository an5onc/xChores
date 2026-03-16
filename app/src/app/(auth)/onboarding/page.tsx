"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const AVATARS = [
  "\u{1F981}", "\u{1F42F}", "\u{1F43B}", "\u{1F43C}", "\u{1F98A}", "\u{1F430}", "\u{1F438}", "\u{1F435}",
  "\u{1F984}", "\u{1F432}", "\u{1F98B}", "\u{1F422}", "\u{1F42C}", "\u{1F99C}", "\u{1F436}", "\u{1F431}",
];

const SUGGESTED_CHORES = [
  { title: "Make Your Bed", dollarValue: 0.5, icon: "\u{1F6CF}\uFE0F" },
  { title: "Take Out Trash", dollarValue: 0.75, icon: "\u{1F5D1}\uFE0F" },
  { title: "Clean Your Room", dollarValue: 1.5, icon: "\u{1F9F9}" },
  { title: "Set the Table", dollarValue: 0.5, icon: "\u{1F37D}\uFE0F" },
  { title: "Feed the Pet", dollarValue: 0.75, icon: "\u{1F436}" },
];

type Kid = {
  id: string;
  name: string;
  age: number;
  avatarId: number;
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

function ConfettiPiece({ index }: { index: number }) {
  const colors = [
    "bg-emerald-400",
    "bg-sky-400",
    "bg-amber-400",
    "bg-pink-400",
    "bg-violet-400",
    "bg-orange-400",
  ];
  const left = Math.random() * 100;
  const delay = Math.random() * 0.5;
  const size = 6 + Math.random() * 8;

  return (
    <motion.div
      className={`absolute rounded-sm ${colors[index % colors.length]}`}
      style={{
        left: `${left}%`,
        top: -20,
        width: size,
        height: size,
      }}
      initial={{ y: -20, rotate: 0, opacity: 1 }}
      animate={{
        y: [0, 600 + Math.random() * 200],
        rotate: [0, 360 + Math.random() * 720],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 2 + Math.random() * 1.5,
        delay,
        ease: "easeIn",
      }}
    />
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [familyName, setFamilyName] = useState("");

  // Step 2 state
  const [kids, setKids] = useState<Kid[]>([]);
  const [kidName, setKidName] = useState("");
  const [kidAge, setKidAge] = useState("");
  const [kidPin, setKidPin] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [addingKid, setAddingKid] = useState(false);
  const [kidError, setKidError] = useState("");

  // Step 3 state
  const [selectedChores, setSelectedChores] = useState<boolean[]>(
    SUGGESTED_CHORES.map(() => true)
  );
  const [choreValues, setChoreValues] = useState<number[]>(
    SUGGESTED_CHORES.map((c) => c.dollarValue)
  );
  const [creatingChores, setCreatingChores] = useState(false);

  useEffect(() => {
    fetch("/api/family/children")
      .then((r) => r.json())
      .then((d) => {
        if (d.children && d.children.length > 0) {
          setKids(d.children);
        }
      })
      .catch(() => {});

    // Fetch family name from parent dashboard data
    fetch("/api/family/members")
      .then((r) => r.json())
      .then((d) => {
        if (d.family?.name) {
          setFamilyName(d.family.name);
        }
      })
      .catch(() => {});
  }, []);

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 4));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  async function addKid() {
    if (!kidName.trim()) {
      setKidError("Please enter a name.");
      return;
    }
    if (!kidAge || parseInt(kidAge) < 1 || parseInt(kidAge) > 18) {
      setKidError("Please enter a valid age (1-18).");
      return;
    }
    if (!kidPin || kidPin.length !== 4 || !/^\d{4}$/.test(kidPin)) {
      setKidError("Please enter a 4-digit PIN.");
      return;
    }

    setAddingKid(true);
    setKidError("");

    try {
      const res = await fetch("/api/family/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: kidName.trim(),
          age: parseInt(kidAge),
          pin: kidPin,
          avatarId: selectedAvatar,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setKidError(body.error || "Failed to add child.");
        return;
      }

      const child = await res.json();
      setKids((prev) => [...prev, child]);
      setKidName("");
      setKidAge("");
      setKidPin("");
      setSelectedAvatar(1);
    } catch {
      setKidError("Something went wrong. Please try again.");
    } finally {
      setAddingKid(false);
    }
  }

  async function createChores() {
    setCreatingChores(true);
    try {
      const choresToCreate = SUGGESTED_CHORES.filter((_, i) => selectedChores[i]);
      await Promise.all(
        choresToCreate.map((chore, idx) => {
          const originalIdx = SUGGESTED_CHORES.findIndex(
            (c) => c.title === chore.title
          );
          return fetch("/api/chores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: chore.title,
              dollarValue: choreValues[originalIdx],
              difficulty: "MEDIUM",
              recurrence: "DAILY",
            }),
          });
        })
      );
      goNext();
    } catch {
      // silently continue to done step even if some chores fail
      goNext();
    } finally {
      setCreatingChores(false);
    }
  }

  const totalSteps = 4;
  const progressPercent = (step / totalSteps) * 100;

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-4 py-8">
      {/* Progress Bar */}
      <div className="w-full max-w-lg">
        <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-500">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="relative mt-8 w-full max-w-lg flex-1">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="rounded-2xl bg-white p-8 shadow-lg"
            >
              <div className="text-center">
                <div className="text-6xl">&#x1F3E0;</div>
                <h1 className="mt-4 text-3xl font-bold text-gray-900">
                  Welcome to xChores!
                </h1>
                {familyName && (
                  <p className="mt-2 text-lg text-emerald-600 font-semibold">
                    {familyName}
                  </p>
                )}
                <p className="mt-2 text-gray-600">
                  Let&apos;s set up your family.
                </p>

                <div className="mt-8 space-y-4 text-left">
                  <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
                    <span className="text-2xl">&#x1F4B0;</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Earn money with chores
                      </h3>
                      <p className="text-sm text-gray-600">
                        Kids complete tasks and earn real allowance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-sky-50 p-4">
                    <span className="text-2xl">&#x1F3E6;</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Learn to save &amp; invest
                      </h3>
                      <p className="text-sm text-gray-600">
                        Teach financial literacy through hands-on practice
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
                    <span className="text-2xl">&#x1F3C6;</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Have fun with achievements
                      </h3>
                      <p className="text-sm text-gray-600">
                        Streaks, badges, and leaderboards keep kids motivated
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={goNext}
                  className="mt-8 w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white transition hover:bg-emerald-700"
                >
                  Let&apos;s Go!
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="rounded-2xl bg-white p-8 shadow-lg"
            >
              <button
                onClick={goBack}
                className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                &#x2190; Back
              </button>

              <h2 className="text-2xl font-bold text-gray-900">Add Your Kids</h2>
              <p className="mt-1 text-gray-600">
                Add each child who will be using xChores.
              </p>

              {/* Added kids */}
              {kids.length > 0 && (
                <div className="mt-4 space-y-2">
                  {kids.map((kid) => (
                    <div
                      key={kid.id}
                      className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3"
                    >
                      <span className="text-3xl">
                        {AVATARS[kid.avatarId - 1] || "\u{1F9D2}"}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{kid.name}</p>
                        {kid.age && (
                          <p className="text-sm text-gray-500">Age {kid.age}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add kid form */}
              <div className="mt-6 space-y-4 rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      value={kidName}
                      onChange={(e) => setKidName(e.target.value)}
                      placeholder="e.g. Emma"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Age
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="18"
                      value={kidAge}
                      onChange={(e) => setKidAge(e.target.value)}
                      placeholder="8"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    4-Digit PIN
                  </label>
                  <input
                    value={kidPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setKidPin(val);
                    }}
                    placeholder="1234"
                    maxLength={4}
                    inputMode="numeric"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Choose Avatar
                  </label>
                  <div className="mt-2 grid grid-cols-8 gap-1.5">
                    {AVATARS.map((emoji, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedAvatar(i + 1)}
                        className={`rounded-xl p-2 text-2xl transition ${
                          selectedAvatar === i + 1
                            ? "bg-sky-100 ring-2 ring-sky-500"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {kidError && (
                  <p className="text-sm text-red-600">{kidError}</p>
                )}

                <button
                  onClick={addKid}
                  disabled={addingKid}
                  className="w-full rounded-lg bg-sky-500 py-2.5 font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
                >
                  {addingKid
                    ? "Adding..."
                    : kids.length > 0
                      ? "+ Add Another Kid"
                      : "+ Add Kid"}
                </button>
              </div>

              <button
                onClick={goNext}
                disabled={kids.length === 0}
                className="mt-6 w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
              {kids.length === 0 && (
                <p className="mt-2 text-center text-sm text-gray-400">
                  Add at least one kid to continue
                </p>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="rounded-2xl bg-white p-8 shadow-lg"
            >
              <button
                onClick={goBack}
                className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                &#x2190; Back
              </button>

              <h2 className="text-2xl font-bold text-gray-900">
                First Chores
              </h2>
              <p className="mt-1 text-gray-600">
                Pick some starter chores for your family. You can always add more
                later!
              </p>

              <div className="mt-6 space-y-3">
                {SUGGESTED_CHORES.map((chore, i) => (
                  <div
                    key={chore.title}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${
                      selectedChores[i]
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedChores[i]}
                      onChange={() => {
                        setSelectedChores((prev) => {
                          const next = [...prev];
                          next[i] = !next[i];
                          return next;
                        });
                      }}
                      className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-2xl">{chore.icon}</span>
                    <span className="flex-1 font-medium text-gray-900">
                      {chore.title}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.25"
                        min="0.25"
                        max="50"
                        value={choreValues[i]}
                        onChange={(e) => {
                          setChoreValues((prev) => {
                            const next = [...prev];
                            next[i] = parseFloat(e.target.value) || 0;
                            return next;
                          });
                        }}
                        className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-right text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={createChores}
                disabled={
                  creatingChores || !selectedChores.some((c) => c)
                }
                className="mt-6 w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingChores ? "Creating Chores..." : "Create Chores"}
              </button>
              {!selectedChores.some((c) => c) && (
                <p className="mt-2 text-center text-sm text-gray-400">
                  Select at least one chore
                </p>
              )}
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg"
            >
              {/* Confetti */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {Array.from({ length: 40 }).map((_, i) => (
                  <ConfettiPiece key={i} index={i} />
                ))}
              </div>

              <button
                onClick={goBack}
                className="relative z-10 mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                &#x2190; Back
              </button>

              <div className="relative z-10 text-center">
                <div className="text-6xl">&#x1F389;</div>
                <h2 className="mt-4 text-3xl font-bold text-gray-900">
                  You&apos;re All Set!
                </h2>
                <p className="mt-2 text-lg text-gray-600">
                  Your family is ready to start earning.
                </p>

                <div className="mx-auto mt-8 max-w-sm space-y-3 text-left">
                  <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
                    <span className="text-xl">&#x2705;</span>
                    <p className="text-gray-900">
                      <strong>{kids.length}</strong>{" "}
                      {kids.length === 1 ? "kid" : "kids"} added
                    </p>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-sky-50 p-4">
                    <span className="text-xl">&#x2705;</span>
                    <p className="text-gray-900">
                      <strong>{selectedChores.filter(Boolean).length}</strong>{" "}
                      starter{" "}
                      {selectedChores.filter(Boolean).length === 1
                        ? "chore"
                        : "chores"}{" "}
                      created
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/parent")}
                  className="mt-8 w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white transition hover:bg-emerald-700"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
