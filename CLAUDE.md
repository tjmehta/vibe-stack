# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up Convex (creates your backend)
npx convex dev          # Start Convex dev server (keep running)

# Start development (in another terminal)
pnpm dev               # Start Next.js with Turbopack

# Tests
pnpm test              # Unit tests (Vitest)
pnpm test:e2e          # E2E tests (Playwright)

# Production
pnpm build             # Build for production
pnpm start             # Start production server
```

## AI Development Tools

This template is pre-configured for AI-assisted development. Use these tools proactively.

### MCP Servers (Auto-loaded)

Three MCP servers are pre-configured in `.mcp.json`:

| Server            | When to Use          | Example Tasks                                     |
| ----------------- | -------------------- | ------------------------------------------------- |
| **shadcn**        | Adding UI components | "Add a dialog component", "Install dropdown menu" |
| **convex**        | Database operations  | "Query the users table", "Check Convex logs"      |
| **next-devtools** | Debugging            | "Show route tree", "Check server logs"            |

**Verify connections:** Run `/mcp` in Claude Code to check status.

**Optional:** Add Vercel MCP for deployment management:

```bash
claude mcp add --transport http vercel https://mcp.vercel.com
```

### Pre-loaded Skills (`.claude/skills/`)

Use these skills when their context applies:

| Skill                     | When to Apply                                     |
| ------------------------- | ------------------------------------------------- |
| **react-best-practices**  | Writing React components, optimizing performance  |
| **web-design-guidelines** | UI/UX decisions, accessibility, responsive design |
| **code-review**           | Before commits, reviewing PRs                     |
| **testing**               | Writing tests, debugging failures                 |
| **deployment**            | Deploying to Convex/Vercel                        |

### External Skills (Install via Claude Code)

**Vercel React Best Practices** - Performance optimization for React/Next.js:

```bash
# Reference: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
# 40+ rules covering waterfalls, bundle size, server rendering, re-renders
```

### Pre-loaded Rules (`.claude/rules/`)

These rules are automatically applied:

- **convex.md** - Schema design, auth patterns, query optimization
- **typescript.md** - Type safety, error handling, import conventions

## Architecture Overview

**Vibe Stack** is a production-ready full-stack starter:

- **Next.js 15** - App Router, Server Actions, React 19, Turbopack
- **Convex** - Backend (database, auth, real-time subscriptions)
- **Stripe** - Payments and subscription management
- **Tailwind CSS 4** + **shadcn/ui** - Styling and components
- **TypeScript** - Strict typing throughout

### Directory Structure

```
vibe-stack/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, signup, logout)
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes (Stripe webhooks)
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── providers/         # React context providers
│   └── hooks/             # Custom React hooks
├── convex/                # Convex backend
│   ├── _generated/        # Auto-generated types (don't edit)
│   ├── schema.ts          # Database schema
│   ├── auth.ts            # Authentication config
│   └── *.ts               # Queries and mutations
├── lib/
│   ├── utils.ts           # Utilities (cn, cleanConvexError)
│   └── payments/          # Stripe integration
├── tests/
│   ├── unit/              # Vitest unit tests
│   └── e2e/               # Playwright E2E tests
├── .claude/               # Claude Code config
│   ├── settings.json      # Permissions
│   ├── rules/             # Auto-applied rules
│   └── skills/            # Invocable skills
└── .mcp.json              # MCP server config
```

## Convex Backend

### Schema Pattern

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  items: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.string(), // ISO timestamp
  }).index("by_user", ["userId"]),
})
```

### Query/Mutation Pattern

```typescript
// convex/items.ts
import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { auth } from "./auth"

export const getItems = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) return []

    return await ctx.db
      .query("items")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()
  },
})

export const createItem = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    return await ctx.db.insert("items", {
      userId,
      title: args.title,
      createdAt: new Date().toISOString(),
    })
  },
})
```

### Authentication

```typescript
// Server-side (Server Actions)
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
// Client-side
import { useAuthActions } from "@convex-dev/auth/react"
import { fetchMutation, fetchQuery } from "convex/nextjs"

const token = await convexAuthNextjsToken()
const user = await fetchQuery(api.currentUser.get, {}, { token })

const { signIn, signOut } = useAuthActions()
await signIn("password", { email, password, flow: "signIn" })
await signOut()
```

## Key Patterns

### Error Handling

Convex errors include stack traces. Clean them:

```typescript
import { cleanConvexError } from "@/lib/utils"

try {
  await signIn("password", { email, password, flow: "signIn" })
} catch (err: any) {
  const message = cleanConvexError(err.message)
  // "Invalid email or password" not stack trace
}
```

### Route Protection

Middleware (`middleware.ts`) auto-protects:

- `/dashboard/*` - requires auth
- `/settings/*` - requires auth

Auth pages (`/login`, `/signup`) redirect authenticated users to dashboard.

### Tailwind Utilities

```typescript
import { cn } from "@/lib/utils"

// Conditional classes
<div className={cn("base-class", isActive && "active-class")} />

// CSS variable colors
<div className="text-primary bg-secondary" />
```

## Testing

### Unit Tests (Vitest)

```bash
pnpm test              # Watch mode
pnpm test:run          # Single run
pnpm test:coverage     # With coverage
```

Tests in `tests/unit/`. Mocks pre-configured for:

- Next.js navigation
- Convex React hooks
- Convex Auth

### E2E Tests (Playwright)

```bash
pnpm test:e2e          # All browsers
pnpm test:e2e:ui       # Interactive UI
```

Tests in `tests/e2e/`. Requires Convex running.

## Environment Variables

This project uses a consistent env file pattern:

| File Pattern                  | Purpose                                       |
| ----------------------------- | --------------------------------------------- |
| `.env.development`            | Development environment vars                  |
| `.env.production`             | Production environment vars                   |
| `.env.convex.development`     | Convex dev deployment vars (local reference)  |
| `.env.convex.production`      | Convex prod deployment vars (local reference) |
| `.env.convex-cli.development` | Convex CLI deploy key for dev                 |
| `.env.convex-cli.production`  | Convex CLI deploy key for prod                |

**Local Development:**

- Next.js loads `.env.development` automatically
- Create with: `cp .env.example .env.development`
- `npx convex dev` creates `.env.local` with Convex URL

**Vercel Deployments:**

- Pull: `pnpm env:pull:vercel`
- Or set via `vercel env add`

**Convex:**

- Pull: `pnpm env:pull:convex`
- Push: `pnpm env:push:convex:development`
- Verify: `pnpm env:verify:convex`

**Required:**

```bash
CONVEX_DEPLOYMENT=          # Auto-generated by npx convex dev
NEXT_PUBLIC_CONVEX_URL=     # Auto-generated by npx convex dev
AUTH_SECRET=                # openssl rand -base64 32
```

**Optional (payments):**

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Common Tasks

### Add a New Table

1. Define schema in `convex/schema.ts`
2. Run `npx convex dev` to sync
3. Create queries/mutations in `convex/tableName.ts`

### Add a Protected Route

1. Create `app/(dashboard)/your-route/page.tsx`
2. Middleware auto-protects all `/dashboard/*` routes

### Add UI Components

Use the shadcn MCP or CLI:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

### Stripe Checkout

1. Create session with `client_reference_id: userId`
2. Webhook receives `checkout.session.completed`
3. `handleCheckoutCompleted()` updates subscription

## Deployment

### Convex

```bash
npx convex deploy       # Deploy functions
npx convex env set KEY=value  # Set env vars
```

### Vercel

1. Push to GitHub
2. Import at vercel.com/new
3. Add env vars in project settings
4. Deploy

Required secrets in Vercel:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOY_KEY`
- `AUTH_SECRET`
- `STRIPE_SECRET_KEY` (if using payments)

## Security Checklist

- [ ] Never expose secrets client-side
- [ ] Always validate auth in Convex functions: `auth.getUserId(ctx)`
- [ ] Use parameterized queries, never string interpolation
- [ ] Validate webhook signatures
- [ ] Keep dependencies updated (Dependabot enabled)
