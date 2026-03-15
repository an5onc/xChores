# xChores — Family Financial Education Platform

## Context

**Problem:** Two kids (ages 11 and 7) need to learn the value of money, effort-to-reward correlation, saving, investing, and delayed gratification — in a way that's interactive and engaging for the whole family.

**Solution:** A real-time web app where parents assign chores with dollar values reflecting effort/time, kids earn into virtual wallets, and every earning triggers financial decisions (save, spend, invest). Parents control investment rewards, encouraging delayed gratification. Everyone logs in to see real-time progress. Data exports to external screens (TV dashboards).

**What makes this different from a chore tracker:** Financial decision-making is woven into every earning event. The app teaches money concepts through experience, not lectures.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14+ (App Router, Server Components) |
| Language | TypeScript (full stack) |
| Styling | Tailwind CSS |
| Animation | Framer Motion (celebrations, balance changes, investment visuals) |
| UI Components | shadcn/ui (accessible base, customized for kid-friendly UI) |
| Database | PostgreSQL (via Railway) |
| ORM | Prisma |
| Auth | NextAuth.js (parents: email/password, kids: avatar + 4-digit PIN) |
| Real-Time | Server-Sent Events (SSE) or Pusher (lightweight, no extra infra) |
| File Storage | Cloudflare R2 (photo proof uploads) |
| Hosting | Cloudflare Pages (frontend) + Railway (API/DB) |
| Scheduling | Railway cron jobs (recurring chore generation, investment maturation) |

---

## Data Model

### Core Entities

```
Family
  id, name, inviteCode, createdAt

User
  id, familyId (FK), name, role (PARENT|CHILD), age?, email?,
  passwordHash?, pin? (4-digit for kids), avatarId, createdAt

Chore
  id, familyId (FK), createdById (FK), title, description?,
  dollarValue, estimatedMinutes, difficulty (EASY|MEDIUM|HARD),
  recurrence (ONCE|DAILY|WEEKLY|MONTHLY|CUSTOM), recurrenceRule?,
  assignedToId? (FK, null = open pool), categoryIcon?,
  photoUrl?, isActive, createdAt

ChoreInstance
  id, choreId (FK), assignedToId? (FK), claimedById? (FK),
  status (AVAILABLE|CLAIMED|IN_PROGRESS|SUBMITTED|APPROVED|REJECTED|REDO),
  dueDate, startedAt?, completedAt?, timeSpentSeconds?,
  proofPhotoUrl?, parentNote?, bonusAmount?, createdAt

Wallet
  id, userId (FK), availableBalance, savedBalance, investedBalance

Transaction
  id, walletId (FK), type (EARNING|SAVING|SPENDING|INVESTMENT|MATURATION|BONUS|MATCH),
  amount, description, choreInstanceId?, investmentId?, savingsGoalId?,
  createdAt

SavingsGoal
  id, userId (FK), name, targetAmount, currentAmount, imageUrl?,
  parentMatchRate? (e.g. 0.5 = $0.50 per $1 saved), isCompleted, createdAt

Investment
  id, userId (FK), principalAmount, status (ACTIVE|MATURED|WITHDRAWN),
  lockDays, maturationDate, returnAmount? (set by parent on maturation),
  parentNote?, createdAt, maturedAt?

Achievement (Phase 2 ready, define model now)
  id, name, description, iconUrl, criteria

UserAchievement
  id, userId (FK), achievementId (FK), earnedAt
```

---

## Feature Breakdown (Full MVP)

### 1. Family Accounts & Auth
- **Parent registration:** email + password, creates a Family with invite code
- **Add family members:** parents add kids (name, age, avatar) with 4-digit PIN
- **Co-parent invite:** email link to join existing family
- **Kid login:** tap avatar from family grid, enter 4-digit PIN (large buttons, visual feedback)
- **Role-based dashboards:** parents see management view, kids see their chore feed + wallet
- **Session persistence:** 24hr sessions on same device

### 2. Chore Management
- **Create chores:** title, description, dollar value, estimated time, difficulty, category icon
- **Recurrence:** one-time, daily, weekly, monthly, custom
- **Quick-add:** floating action button for one-time tasks (title + dollar value only, <15 seconds)
- **Assignment:** assign to specific child or leave as open pool (first-come-first-served)
- **Chore feed (kids):** visual cards with icons, dollar value, time estimate, difficulty indicator
- **Claiming:** kid claims chore, it disappears from sibling's feed in real-time
- **Time tracking:** visible timer (start/pause/stop), server-side timestamps for accuracy
- **Submission:** kid marks done, optionally attaches photo proof
- **Parent review queue:** approve, reject, request redo (with note), bonus payment option
- **Bulk approve:** for efficiency

### 3. Virtual Wallet & Financial Decisions
- **Persistent balance widget:** visible on every screen, real-time updates
- **Decision point (after every approved chore):** "What do you want to do with your $X?"
  - **Spend:** goes to available balance
  - **Save:** allocate toward a savings goal
  - **Invest:** lock for parent-controlled future reward
- **Split allocation:** slider or manual entry to split earnings across options
- **Age-adaptive messaging:**
  - 7yo: icons, animations, "Plant your money like a seed!"
  - 11yo: actual numbers, percentages, before/after comparisons
- **Transaction ledger:** full history per user, categorized

### 4. Savings Goals
- **Create goal:** name, target amount, optional image
- **Visual progress:** animated thermometer/jar filling up
- **Up to 3 active goals per child**
- **Parent matching:** optional match rate (e.g. $1 per $2 saved)
- **Celebration on completion**

### 5. Investment Mechanic (Parent-Controlled)
- **Invest any amount** from wallet, choose lock period (1 week, 2 weeks, 1 month)
- **Parent sets the return** when investment matures (teaches real-world unpredictability)
- **Visual "growing" animation** during lock period (plant growing, piggy bank filling)
- **Cannot withdraw early** (parent emergency override exists)
- **Maturation notification** to parent → parent decides payout → celebration for kid
- **Portfolio view:** see all active and past investments

### 6. Real-Time Dashboard & Notifications
- **Family activity feed:** live stream of events (chore completed, money earned, goal progress)
- **Real-time updates:** chore claims, balance changes, approvals visible instantly
- **Parent notifications:** chore submitted for review, savings goal reached, investment matured
- **Proactive reward:** parents can send bonus rewards from any screen

### 7. Data Export & External Display
- **CSV export:** transaction history, chore history, earnings summary
- **JSON API endpoint:** for external dashboard consumption
- **TV/Kiosk mode:** simplified read-only dashboard view optimized for large screens
  - Family leaderboard, today's chores, recent achievements, wallet balances
  - Auto-refresh, large text, celebration animations
  - Accessible via special URL (no login required, family-specific token)

---

## Project Structure

```
xChores/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Parent login
│   │   ├── register/page.tsx       # Parent registration
│   │   ├── kid-login/page.tsx      # Avatar grid + PIN entry
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── parent/
│   │   │   ├── page.tsx            # Parent dashboard
│   │   │   ├── chores/page.tsx     # Chore management
│   │   │   ├── review/page.tsx     # Approval queue
│   │   │   ├── family/page.tsx     # Family member management
│   │   │   ├── ledger/page.tsx     # Transaction history
│   │   │   └── investments/page.tsx # Manage investment returns
│   │   ├── kid/
│   │   │   ├── page.tsx            # Kid dashboard
│   │   │   ├── chores/page.tsx     # Available chore feed
│   │   │   ├── wallet/page.tsx     # Wallet + decision point
│   │   │   ├── savings/page.tsx    # Savings goals
│   │   │   └── investments/page.tsx # Portfolio view
│   │   └── layout.tsx              # Shared dashboard layout
│   ├── tv/[token]/page.tsx         # TV/kiosk dashboard (no auth)
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── chores/route.ts
│   │   ├── chore-instances/route.ts
│   │   ├── wallet/route.ts
│   │   ├── transactions/route.ts
│   │   ├── savings-goals/route.ts
│   │   ├── investments/route.ts
│   │   ├── family/route.ts
│   │   ├── export/route.ts         # CSV/JSON export
│   │   ├── tv/[token]/route.ts     # TV dashboard data
│   │   └── realtime/route.ts       # SSE endpoint
│   ├── layout.tsx
│   └── page.tsx                    # Landing/redirect
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── auth/                       # Login forms, avatar grid, PIN pad
│   ├── chores/                     # Chore cards, feed, timer, review queue
│   ├── wallet/                     # Balance widget, decision point, ledger
│   ├── savings/                    # Goal cards, progress bars
│   ├── investments/                # Portfolio, growth animations
│   ├── dashboard/                  # Activity feed, stats cards
│   └── shared/                     # Layout, navigation, celebrations
├── lib/
│   ├── db.ts                       # Prisma client
│   ├── auth.ts                     # NextAuth config + PIN auth
│   ├── realtime.ts                 # SSE helpers
│   └── utils.ts                    # Shared utilities
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── seed.ts                     # Seed data for development
├── public/
│   ├── avatars/                    # 16 kid avatar images
│   └── icons/                      # Chore category icons
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Implementation Order

### Sprint 1: Foundation (Week 1-2)
1. Project scaffolding: Next.js 14, Tailwind, shadcn/ui, Prisma, TypeScript
2. Prisma schema: all entities defined above
3. Railway PostgreSQL setup + initial migration
4. NextAuth.js: parent email/password auth
5. Custom PIN auth layer for kids
6. Family creation + member management
7. Avatar grid login for kids
8. Role-based layout and routing middleware

### Sprint 2: Chore Engine (Week 2-3)
1. Chore CRUD (parent creates/edits/deletes)
2. Recurrence engine (generates ChoreInstances from Chore templates)
3. Quick-add one-time task modal
4. Kid chore feed with visual cards
5. Claim/unclaim with real-time updates
6. Timer component (start/pause/stop)
7. Submission flow with optional photo proof
8. Parent review queue (approve/reject/redo/bonus)

### Sprint 3: Financial Engine (Week 3-4)
1. Wallet model + balance tracking
2. Transaction ledger
3. Decision point screen (save/spend/invest split)
4. Age-adaptive messaging system
5. Savings goals CRUD + progress visualization
6. Investment creation flow
7. Parent investment return management
8. Investment maturation + payout

### Sprint 4: Real-Time, Dashboard, Export (Week 4-5)
1. SSE real-time event system
2. Family activity feed
3. Parent dashboard with stats
4. Kid dashboard with wallet widget
5. Celebration animations (Framer Motion)
6. CSV/JSON data export
7. TV/kiosk mode view
8. Notification system (in-app)

### Sprint 5: Polish & Deploy (Week 5-6)
1. Responsive design pass (mobile-first for kids)
2. Error handling and edge cases
3. Cloudflare Pages deployment
4. Railway production database
5. Cron jobs for recurring chores and investment checks
6. End-to-end testing
7. Seed data for demo/testing

---

## Verification Plan

1. **Auth flow:** Register parent → create family → add 2 kids → kid logs in via avatar+PIN
2. **Chore lifecycle:** Parent creates chore → kid sees it → claims → starts timer → submits → parent approves → money hits wallet
3. **Financial decisions:** After approval → decision point appears → split across save/spend/invest → balances update correctly
4. **Savings goal:** Create goal → allocate earnings → progress bar updates → celebration on completion
5. **Investment flow:** Kid invests → locked period → parent sets return → maturation → payout with celebration
6. **Real-time:** Two browsers open → one kid claims chore → disappears from other kid's feed instantly
7. **Quick-add:** Parent adds one-time task from FAB → appears in kid's feed immediately
8. **Export:** Download CSV of transaction history → verify data accuracy
9. **TV mode:** Open TV URL → shows family dashboard → auto-updates as events occur
10. **Responsive:** Test on mobile viewport (375px) → all kid-facing screens usable with large touch targets

---

## Key Design Principles

- **Design for the 7-year-old first.** If the youngest can use it, everyone can.
- **Icons over text.** Difficulty, category, and status communicated visually.
- **Large touch targets.** Minimum 48px for all interactive elements on kid screens.
- **Instant feedback.** Every action gets visual confirmation (animation, sound, color change).
- **Parents shouldn't feel like they're doing homework.** Review queue must be fast — bulk approve, minimal taps.
- **Money feels real.** Dollar amounts displayed prominently. Kids should feel the weight of financial decisions.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| 7yo can't navigate the app | High | Design kid UI first, icon-heavy, test with real kids |
| Kids lose interest | High | Celebration animations in Sprint 4, gamification ready for Phase 2 |
| Parent review becomes a chore | Medium | Bulk approve, push notifications, auto-approve option later |
| Real-time complexity | Medium | Start with SSE (simple), upgrade to WebSocket if needed |
| Scope is ambitious for MVP | High | Strict sprint boundaries, cut TV mode to Sprint 4 if behind |
