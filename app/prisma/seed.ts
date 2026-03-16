import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { hash } from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://xchores:xchores_dev@localhost:5432/xchores",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding xChores database...");

  // Clean existing data
  await prisma.transaction.deleteMany();
  await prisma.choreInstance.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.savingsGoal.deleteMany();
  await prisma.chore.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();
  await prisma.family.deleteMany();

  // Create family
  const family = await prisma.family.create({
    data: {
      name: "The Cordeiro Family",
      inviteCode: "CORDEIRO2026",
      tvToken: "tv-cordeiro-live",
    },
  });

  console.log(`Created family: ${family.name} (code: ${family.inviteCode})`);

  // Create parent
  const parentPassword = await hash("password123", 12);
  const parent = await prisma.user.create({
    data: {
      familyId: family.id,
      name: "Dad",
      role: "PARENT",
      email: "dad@xchores.dev",
      passwordHash: parentPassword,
      avatarId: 1, // Lion
      wallet: { create: {} },
    },
  });
  console.log(`Created parent: ${parent.name} (${parent.email})`);

  // Create kids
  const kidPin = await hash("1234", 12);

  const kid1 = await prisma.user.create({
    data: {
      familyId: family.id,
      name: "Alex",
      role: "CHILD",
      age: 11,
      pin: kidPin,
      avatarId: 5, // Fox
      wallet: { create: { availableBalance: 15.50, savedBalance: 8.00, investedBalance: 5.00 } },
    },
  });

  const kid2 = await prisma.user.create({
    data: {
      familyId: family.id,
      name: "Jordan",
      role: "CHILD",
      age: 7,
      pin: kidPin,
      avatarId: 9, // Unicorn
      wallet: { create: { availableBalance: 7.25, savedBalance: 3.00, investedBalance: 0 } },
    },
  });

  console.log(`Created kids: ${kid1.name} (age ${kid1.age}), ${kid2.name} (age ${kid2.age})`);
  console.log(`Kid PIN for both: 1234`);

  // Create chores
  const chores = await Promise.all([
    prisma.chore.create({
      data: {
        familyId: family.id,
        createdById: parent.id,
        title: "Make Your Bed",
        description: "Pull up the sheets and comforter, fluff the pillows",
        dollarValue: 0.50,
        estimatedMinutes: 5,
        difficulty: "EASY",
        recurrence: "DAILY",
        categoryIcon: "bed",
      },
    }),
    prisma.chore.create({
      data: {
        familyId: family.id,
        createdById: parent.id,
        title: "Unload the Dishwasher",
        description: "Put all clean dishes away in the right cabinets",
        dollarValue: 2.00,
        estimatedMinutes: 15,
        difficulty: "MEDIUM",
        recurrence: "DAILY",
        categoryIcon: "dishes",
      },
    }),
    prisma.chore.create({
      data: {
        familyId: family.id,
        createdById: parent.id,
        title: "Take Out the Trash",
        description: "All trash cans to the curb, replace bags",
        dollarValue: 1.50,
        estimatedMinutes: 10,
        difficulty: "EASY",
        recurrence: "WEEKLY",
        categoryIcon: "trash",
      },
    }),
    prisma.chore.create({
      data: {
        familyId: family.id,
        createdById: parent.id,
        title: "Vacuum the Living Room",
        description: "Move furniture, vacuum under and around everything",
        dollarValue: 3.00,
        estimatedMinutes: 20,
        difficulty: "MEDIUM",
        recurrence: "WEEKLY",
        categoryIcon: "vacuum",
      },
    }),
    prisma.chore.create({
      data: {
        familyId: family.id,
        createdById: parent.id,
        title: "Mow the Front Lawn",
        description: "Mow, edge, and blow off the driveway",
        dollarValue: 5.00,
        estimatedMinutes: 30,
        difficulty: "HARD",
        recurrence: "WEEKLY",
        assignedToId: kid1.id, // Assigned to older kid
        categoryIcon: "lawn",
      },
    }),
    prisma.chore.create({
      data: {
        familyId: family.id,
        createdById: parent.id,
        title: "Feed the Dog",
        description: "One scoop of food, fresh water",
        dollarValue: 0.75,
        estimatedMinutes: 5,
        difficulty: "EASY",
        recurrence: "DAILY",
        assignedToId: kid2.id, // Assigned to younger kid
        categoryIcon: "pet",
      },
    }),
    prisma.chore.create({
      data: {
        familyId: family.id,
        createdById: parent.id,
        title: "Clean Your Room",
        description: "Pick up toys, organize desk, put clothes away",
        dollarValue: 2.50,
        estimatedMinutes: 20,
        difficulty: "MEDIUM",
        recurrence: "WEEKLY",
        categoryIcon: "room",
      },
    }),
    prisma.chore.create({
      data: {
        familyId: family.id,
        createdById: parent.id,
        title: "Wash the Car",
        description: "Soap, rinse, dry the outside. Vacuum the inside.",
        dollarValue: 7.50,
        estimatedMinutes: 45,
        difficulty: "HARD",
        recurrence: "ONCE",
        categoryIcon: "car",
      },
    }),
  ]);

  console.log(`Created ${chores.length} chores`);

  // Create chore instances with various statuses
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Available instances (open pool)
  await prisma.choreInstance.create({
    data: { choreId: chores[0].id, status: "AVAILABLE", dueDate: today },
  });
  await prisma.choreInstance.create({
    data: { choreId: chores[1].id, status: "AVAILABLE", dueDate: today },
  });
  await prisma.choreInstance.create({
    data: { choreId: chores[6].id, status: "AVAILABLE", dueDate: today },
  });
  await prisma.choreInstance.create({
    data: { choreId: chores[7].id, status: "AVAILABLE" }, // One-time: wash car
  });

  // Alex claimed and is working on vacuuming
  await prisma.choreInstance.create({
    data: {
      choreId: chores[3].id,
      claimedById: kid1.id,
      status: "IN_PROGRESS",
      startedAt: new Date(now.getTime() - 10 * 60000), // Started 10 min ago
      dueDate: today,
    },
  });

  // Alex submitted trash for review
  await prisma.choreInstance.create({
    data: {
      choreId: chores[2].id,
      claimedById: kid1.id,
      status: "SUBMITTED",
      startedAt: new Date(now.getTime() - 30 * 60000),
      completedAt: new Date(now.getTime() - 20 * 60000),
      timeSpentSeconds: 480,
      dueDate: today,
    },
  });

  // Jordan's assigned chore (feed dog) - available
  await prisma.choreInstance.create({
    data: {
      choreId: chores[5].id,
      assignedToId: kid2.id,
      status: "AVAILABLE",
      dueDate: today,
    },
  });

  // Alex's assigned chore (mow lawn) - available
  await prisma.choreInstance.create({
    data: {
      choreId: chores[4].id,
      assignedToId: kid1.id,
      status: "AVAILABLE",
      dueDate: today,
    },
  });

  // Some completed from yesterday
  const yesterday = new Date(today.getTime() - 86400000);
  await prisma.choreInstance.create({
    data: {
      choreId: chores[0].id,
      claimedById: kid2.id,
      status: "APPROVED",
      startedAt: yesterday,
      completedAt: yesterday,
      timeSpentSeconds: 180,
      dueDate: yesterday,
    },
  });
  await prisma.choreInstance.create({
    data: {
      choreId: chores[1].id,
      claimedById: kid1.id,
      status: "APPROVED",
      startedAt: yesterday,
      completedAt: yesterday,
      timeSpentSeconds: 720,
      bonusAmount: 0.50,
      dueDate: yesterday,
    },
  });

  console.log("Created chore instances with various statuses");

  // Create savings goals
  const goal1 = await prisma.savingsGoal.create({
    data: {
      userId: kid1.id,
      name: "Nintendo Switch Game",
      targetAmount: 59.99,
      currentAmount: 8.00,
      parentMatchRate: 0.5, // Dad matches $0.50 per $1 saved
    },
  });

  const goal2 = await prisma.savingsGoal.create({
    data: {
      userId: kid2.id,
      name: "Lego Star Wars Set",
      targetAmount: 29.99,
      currentAmount: 3.00,
    },
  });

  await prisma.savingsGoal.create({
    data: {
      userId: kid1.id,
      name: "New Basketball",
      targetAmount: 25.00,
      currentAmount: 25.00,
      isCompleted: true, // Already achieved!
    },
  });

  console.log("Created savings goals");

  // Create investments
  const oneWeekFromNow = new Date(now.getTime() + 7 * 86400000);
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 86400000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);

  await prisma.investment.create({
    data: {
      userId: kid1.id,
      principalAmount: 5.00,
      lockDays: 14,
      maturationDate: twoWeeksFromNow,
      status: "ACTIVE",
    },
  });

  // Matured investment (ready for parent to set return)
  await prisma.investment.create({
    data: {
      userId: kid1.id,
      principalAmount: 3.00,
      lockDays: 7,
      maturationDate: threeDaysAgo, // Already matured!
      status: "ACTIVE", // Parent hasn't set return yet
    },
  });

  // Past completed investment
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
  await prisma.investment.create({
    data: {
      userId: kid1.id,
      principalAmount: 2.00,
      lockDays: 7,
      maturationDate: twoWeeksAgo,
      status: "MATURED",
      returnAmount: 3.50,
      parentNote: "Great patience! You earned 75% return!",
      maturedAt: twoWeeksAgo,
    },
  });

  console.log("Created investments");

  // Create transaction history
  const kid1Wallet = await prisma.wallet.findUnique({ where: { userId: kid1.id } });
  const kid2Wallet = await prisma.wallet.findUnique({ where: { userId: kid2.id } });

  if (kid1Wallet && kid2Wallet) {
    await prisma.transaction.createMany({
      data: [
        // Alex's transactions
        { walletId: kid1Wallet.id, type: "EARNING", amount: 2.00, description: "Completed: Unload the Dishwasher", createdAt: yesterday },
        { walletId: kid1Wallet.id, type: "BONUS", amount: 0.50, description: "Bonus for great work!", createdAt: yesterday },
        { walletId: kid1Wallet.id, type: "SAVING", amount: 3.00, description: "Saved toward Nintendo Switch Game", savingsGoalId: goal1.id, createdAt: new Date(yesterday.getTime() + 3600000) },
        { walletId: kid1Wallet.id, type: "INVESTMENT", amount: 5.00, description: "Invested for 14 days", createdAt: new Date(yesterday.getTime() + 7200000) },
        { walletId: kid1Wallet.id, type: "MATURATION", amount: 3.50, description: "Investment matured! Invested $2.00, earned $3.50", createdAt: twoWeeksAgo },
        { walletId: kid1Wallet.id, type: "EARNING", amount: 5.00, description: "Completed: Mow the Front Lawn", createdAt: new Date(now.getTime() - 5 * 86400000) },
        { walletId: kid1Wallet.id, type: "EARNING", amount: 3.00, description: "Completed: Vacuum the Living Room", createdAt: new Date(now.getTime() - 3 * 86400000) },
        { walletId: kid1Wallet.id, type: "SAVING", amount: 5.00, description: "Saved toward Nintendo Switch Game", savingsGoalId: goal1.id, createdAt: new Date(now.getTime() - 4 * 86400000) },

        // Jordan's transactions
        { walletId: kid2Wallet.id, type: "EARNING", amount: 0.50, description: "Completed: Make Your Bed", createdAt: yesterday },
        { walletId: kid2Wallet.id, type: "EARNING", amount: 0.75, description: "Completed: Feed the Dog", createdAt: new Date(now.getTime() - 2 * 86400000) },
        { walletId: kid2Wallet.id, type: "SAVING", amount: 3.00, description: "Saved toward Lego Star Wars Set", savingsGoalId: goal2.id, createdAt: new Date(now.getTime() - 2 * 86400000) },
        { walletId: kid2Wallet.id, type: "EARNING", amount: 2.00, description: "Completed: Clean Your Room", createdAt: new Date(now.getTime() - 4 * 86400000) },
      ],
    });
  }

  console.log("Created transaction history");

  console.log("\n✅ Seed complete!\n");
  console.log("Login credentials:");
  console.log("  Parent: dad@xchores.dev / password123");
  console.log("  Kids: Family code 'CORDEIRO2026', PIN '1234'");
  console.log(`  TV Dashboard: /tv/${family.tvToken}`);
  console.log(`\n  Alex (11yo) - 🦊 Fox avatar`);
  console.log(`  Jordan (7yo) - 🦄 Unicorn avatar`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
