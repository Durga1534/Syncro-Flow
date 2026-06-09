# Syncro Flow

**A real-time collaborative workspace platform** where teams manage tasks, invite members, and see live updates across every connected browser — built with Next.js 16, PostgreSQL, and WebSocket pub/sub.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle-336791?style=flat-square&logo=postgresql)](https://orm.drizzle.team/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square)](https://clerk.com/)
[![Pusher](https://img.shields.io/badge/Realtime-Pusher-300D4F?style=flat-square)](https://pusher.com/)

---

## Table of Contents

- [Why This Project Exists](#why-this-project-exists)
- [Demo](#demo)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Realtime Data Flow](#realtime-data-flow)
- [Database Schema](#database-schema)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Server Actions & Events](#server-actions--events)
- [Design Decisions](#design-decisions)
- [Resilience & Fallbacks](#resilience--fallbacks)
- [Scripts](#scripts)
- [Roadmap](#roadmap)
- [Author](#author)

---

## Why This Project Exists

Most task boards are **single-user CRUD apps**. Real collaboration requires three hard problems solved together:

1. **Authoritative persistence** — every change must survive refreshes and crashes
2. **Low-latency fan-out** — User A's update must reach User B in under ~100ms
3. **Multi-tenant security** — workspaces, roles, and membership must be enforced on every mutation

Syncro Flow is a production-shaped answer: PostgreSQL as the source of truth, Server Actions for validated mutations, and Pusher WebSockets for sub-second cross-client synchronization — with automatic polling fallback when the realtime channel drops.

---

## Demo

> **Live:** _Add your Vercel URL here after deployment_

**Quick test (local):**
1. Open `http://localhost:3000` in two browser windows
2. Sign in as two different users in the same workspace
3. Create or update a task in one window — watch it appear instantly in the other

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Multi-tenant workspaces** | Isolated workspaces with owner-scoped onboarding |
| **RBAC** | `owner` · `admin` · `member` roles with enforced server-side checks |
| **Kanban task board** | Todo → In Progress → Done → Blocked columns with inline status & assignee updates |
| **Live activity feed** | Audit log of task, member, and workspace events |
| **Member management** | Invite by email, list members, remove (owner/admin) |
| **Realtime sync** | Pusher pub/sub per workspace channel (`workspace-{id}`) |
| **Graceful degradation** | Auto polling every 5s when WebSocket disconnects |
| **Type-safe mutations** | Zod validation + unified `createAction` wrapper on all server actions |
| **Clerk webhooks** | Automatic user provisioning into PostgreSQL on sign-up |

---

## System Architecture

```mermaid
flowchart TB
    subgraph Clients["Browser Clients"]
        UA["User A<br/>(React 19)"]
        UB["User B<br/>(React 19)"]
    end

    subgraph Vercel["Next.js 16 App (Vercel)"]
        MW["Clerk Middleware<br/>Session Guard"]
        SA["Server Actions<br/>Zod + Auth"]
        WH["Clerk Webhook<br/>/api/webhooks/clerk"]
        RSC["React Server Components<br/>Initial Data Load"]
        WP["WorkspaceProvider<br/>Client State + Realtime"]
    end

    subgraph External["Managed Services"]
        CLERK["Clerk<br/>Authentication"]
        PUSHER["Pusher<br/>WebSocket Pub/Sub"]
        PG[("PostgreSQL<br/>Source of Truth")]
        REDIS[("Upstash Redis<br/>Ready for cache / pub-sub")]
    end

    UA -->|"HTTPS + Server Actions"| MW
    UB -->|"HTTPS + Server Actions"| MW
    MW --> SA
    MW --> RSC
    RSC -->|"Drizzle ORM"| PG
    SA -->|"Write + Read"| PG
    SA -->|"trigger()"| PUSHER
    WH -->|"user.created"| PG
    CLERK -->|"JWT / Webhooks"| MW
    CLERK --> WH

    PUSHER -->|"task-created<br/>task-status-updated<br/>task-assigned"| WP
    WP --> UA
    WP --> UB

    SA -.->|"future: cache layer"| REDIS

    style PG fill:#336791,color:#fff
    style PUSHER fill:#300D4F,color:#fff
    style CLERK fill:#6C47FF,color:#fff
```

---

## Realtime Data Flow

When **User A** updates a task, this is the end-to-end path:

```mermaid
sequenceDiagram
    autonumber
    participant A as User A Browser
    participant SA as Server Action
    participant PG as PostgreSQL
    participant PS as Pusher
    participant B as User B Browser
    participant WP as WorkspaceProvider

    A->>SA: updateTaskStatus({ taskId, status })
    SA->>SA: Clerk auth() + Zod validate
    SA->>SA: Membership check (workspace_members)
    SA->>PG: UPDATE tasks SET status = ...
    PG-->>SA: Updated row
    SA->>PG: INSERT activity_log
    SA->>PS: trigger("workspace-{id}", "task-status-updated")
    SA-->>A: { success, data }

    PS-->>WP: WebSocket event
    WP->>WP: Merge into local task state
    WP->>WP: Append to activity feed
    WP-->>B: UI re-renders (< 100ms target)
```

### Estimated Latency Budget

| Step | Action | Latency |
|------|--------|---------|
| 1 | User A → Server (HTTP / Server Action) | ~30–40ms |
| 2 | Auth + Zod validation + membership check | ~5ms |
| 3 | PostgreSQL write + activity log | ~10–20ms |
| 4 | Pusher trigger → subscriber fan-out | ~2–5ms |
| 5 | User B WebSocket receive → React render | ~20–40ms |
| | **Total (typical)** | **~70–110ms** |

---

## Database Schema

```mermaid
erDiagram
    users ||--o{ workspace_members : "belongs to"
    users ||--o{ workspaces : "owns"
    workspaces ||--o{ workspace_members : "has"
    workspaces ||--o{ tasks : "contains"
    workspaces ||--o{ activity_log : "logs"
    users ||--o{ tasks : "assigned to"
    users ||--o{ tasks : "created by"
    users ||--o{ activity_log : "performed by"

    users {
        varchar id PK
        varchar email UK
        varchar name
        varchar avatar
        timestamp created_at
    }

    workspaces {
        uuid id PK
        varchar name
        varchar owner_id FK
        timestamp created_at
    }

    workspace_members {
        varchar user_id PK,FK
        uuid workspace_id PK,FK
        enum role
        timestamp joined_at
    }

    tasks {
        uuid id PK
        uuid workspace_id FK
        varchar title
        text description
        enum status
        enum priority
        varchar assignee_id FK
        varchar created_by FK
        timestamp created_at
        timestamp updated_at
    }

    activity_log {
        uuid id PK
        uuid workspace_id FK
        varchar user_id FK
        varchar action
        varchar entity_type
        uuid entity_id
        jsonb metadata
        timestamp created_at
    }
```

**Enums:** `roles` (owner, admin, member) · `task_status` (todo, in_progress, done, blocked) · `priority` (low, medium, high)

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 16 (App Router) | Server Components, Server Actions, parallel routes |
| **Language** | TypeScript 5 | End-to-end type safety |
| **UI** | React 19 + Tailwind CSS 4 + shadcn/ui | Accessible, composable components |
| **Auth** | Clerk | OAuth, sessions, webhooks, production-ready |
| **Database** | PostgreSQL + Drizzle ORM | ACID transactions, foreign keys, relational queries |
| **Realtime** | Pusher (WebSockets) | Managed pub/sub without operating socket servers |
| **Cache (ready)** | Upstash Redis + ioredis | Configured for future caching / Redis pub-sub |
| **Validation** | Zod 4 | Runtime input validation on every mutation |

---

## Project Structure

```
collab-dashboard/
├── app/
│   ├── (auth)/                    # Clerk sign-in / sign-up
│   ├── (dashboard)/
│   │   └── workspace/[id]/
│   │       ├── @tasks/            # Parallel route — assigned tasks panel
│   │       ├── @activity/         # Parallel route — live activity feed
│   │       ├── members/           # Member invite & management
│   │       ├── layout.tsx         # Server fetch → WorkspaceProvider
│   │       └── page.tsx           # Kanban board + stats
│   ├── actions/
│   │   ├── tasks.ts               # createTask, updateTaskStatus, assignTask
│   │   ├── workspace.ts           # inviteMember, removeMember
│   │   ├── onboarding.ts          # Workspace creation flow
│   │   └── queries.ts             # Read queries with membership guards
│   ├── api/webhooks/clerk/        # User sync webhook (Svix verified)
│   ├── hooks/useWorkspace.realtime.ts
│   ├── lib/
│   │   ├── db/schema.ts           # Drizzle schema + relations
│   │   ├── pusher/server.ts       # Server-only Pusher SDK
│   │   ├── pusher/client.ts       # Browser-only pusher-js
│   │   └── safe.actions.ts        # createAction auth + Zod wrapper
│   ├── providers/workspace-provider.tsx  # State + realtime + polling fallback
│   └── onboarding/
├── components/
│   ├── tasks/                     # TaskBoard, TaskCard, CreateTaskDialog
│   └── workspace/                 # Sidebar, ActivityFeed, InviteMemberForm
└── drizzle.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database ([Neon](https://neon.tech), [Supabase](https://supabase.com), or local)
- [Clerk](https://clerk.com) application
- [Pusher](https://pusher.com) Channels app
- (Optional) [Upstash Redis](https://upstash.com) for future cache layer

### Installation

```bash
git clone https://github.com/Durga1534/collab-dashboard.git
cd collab-dashboard
npm install
```

### Database Setup

```bash
# Push schema to your PostgreSQL instance
npm run db:push

# Or generate + run migrations
npm run db:generate
npm run db:migrate

# Open Drizzle Studio (optional)
npm run db:studio
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Clerk Webhook (required for user sync)

1. In Clerk Dashboard → **Webhooks** → Add endpoint: `https://your-domain/api/webhooks/clerk`
2. Subscribe to: `user.created`, `user.updated`, `user.deleted`
3. Copy the signing secret to `CLERK_WEBHOOK_SECRET`

For local development, use [ngrok](https://ngrok.com) or Clerk's dev tooling to forward webhooks.

---

## Environment Variables

Create `.env.local`:

```env
# ─── Database ───────────────────────────────────────────
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# ─── Clerk ──────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# ─── Pusher (Realtime) ──────────────────────────────────
NEXT_PUBLIC_PUSHER_APP_ID=your_app_id
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=ap2
PUSHER_SECRET=your_secret

# ─── Upstash Redis (optional — future cache layer) ──────
UPSTASH_REDIS_URL=rediss://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Server Actions & Events

### Mutations

| Action | File | Auth Check |
|--------|------|------------|
| `createTask` | `actions/tasks.ts` | Workspace membership |
| `updateTaskStatus` | `actions/tasks.ts` | Workspace membership |
| `assignTask` | `actions/tasks.ts` | Membership + assignee in workspace |
| `createWorkspace` | `actions/onboarding.ts` | Authenticated user |
| `inviteMember` | `actions/workspace.ts` | Workspace owner only |
| `removeMember` | `actions/workspace.ts` | Owner or admin |

### Pusher Channels

| Channel | Event | Payload |
|---------|-------|---------|
| `workspace-{id}` | `task-created` | `{ taskId, title, priority, assigneeId, ... }` |
| `workspace-{id}` | `task-status-updated` | `{ taskId, status, updatedBy }` |
| `workspace-{id}` | `task-assigned` | `{ taskId, assigneeId, updatedBy }` |

Every mutation follows the same pattern:

```
Validate (Zod) → Authorize (membership) → Persist (PostgreSQL) → Broadcast (Pusher) → Audit (activity_log)
```

---

## Design Decisions

### PostgreSQL over MongoDB

Tasks don't exist in isolation — they belong to users, workspaces, and permission boundaries. PostgreSQL gives:

- **Foreign key integrity** — no orphaned tasks or dangling assignees
- **ACID transactions** — task update + activity log succeed or fail together
- **Relational queries** — Drizzle `with: { assignee: true }` in a single round-trip

### Server Actions over REST API routes

- Colocated with the UI, no separate API contract to maintain
- Clerk `auth()` available without manual token parsing
- Zod validation at the boundary via `createAction` helper
- Type-safe return shape: `{ success: true, data } | { success: false, error }`

### Pusher over self-hosted WebSockets

- No socket server to deploy, scale, or monitor
- Channel-based pub/sub maps directly to `workspace-{id}`
- Server SDK (`pusher`) and client SDK (`pusher-js`) are split into separate files to avoid SSR bundling issues

### Split Pusher client / server modules

`pusher-js` is browser-only. Importing it from server action files causes `default is not a constructor` at runtime. Fix:

```
app/lib/pusher/server.ts  →  used by Server Actions
app/lib/pusher/client.ts  →  "use client", used by hooks only
```

---

## Resilience & Fallbacks

| Failure | Behavior |
|---------|----------|
| **Pusher disconnects** | Sidebar shows "Polling" badge; client refetches every 5s |
| **Pusher reconnects** | Sidebar shows "Live" badge; polling stops |
| **User not in workspace** | Server action returns error; layout redirects to `/onboarding` |
| **Invalid input** | Zod rejects before any DB write |
| **Redis unavailable** | App continues — Redis is not on the critical path today |

See [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) for deeper notes on Redis Sentinel, exponential backoff, and HA patterns.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Drizzle Studio GUI |

---

## Roadmap

- [ ] Drag-and-drop Kanban columns
- [ ] Task edit / delete
- [ ] Redis caching for read-heavy queries
- [ ] Redis pub/sub as Pusher alternative (self-hosted path)
- [ ] Optimistic UI with rollback on mutation failure
- [ ] E2E tests (Playwright) for realtime two-tab sync
- [ ] Workspace settings & rename
- [ ] Deploy to Vercel with CI (GitHub Actions)

---

## Author

**Konduru Durga Prasad**

Full Stack Developer · Bangalore, India

[![LinkedIn](https://img.shields.io/badge/LinkedIn-durga--prasad--konduru-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/durga-prasad-konduru)
[![GitHub](https://img.shields.io/badge/GitHub-Durga1534-181717?style=flat-square&logo=github)](https://github.com/Durga1534)
[![Portfolio](https://img.shields.io/badge/Portfolio-durga--prasad.dev-000?style=flat-square&logo=vercel)](https://durga-prasad-portfolio1.vercel.app)

---

<p align="center">
  Built with Next.js, PostgreSQL, and a focus on real-time collaboration at scale.
</p>
