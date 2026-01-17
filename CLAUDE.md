# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up Convex
npx convex dev          # Start Convex development server (runs in background)

# Start development
pnpm dev               # Start Next.js dev server with Turbopack

# Production
pnpm build             # Build for production
pnpm start             # Start production server
```

## Architecture Overview

**Vibe Stack** is a production-ready full-stack starter built on:

- **Next.js 15** - App Router, Server Actions, React 19, Turbopack
- **Convex** - Backend (database, auth, real-time subscriptions)
- **Stripe** - Payments and subscription management
- **Tailwind CSS 4** + **shadcn/ui** - Styling and components
- **TypeScript** - Strict typing throughout

### Directory Structure

```
vibe-stack/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes (login, signup, logout)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── (home)/            # Public marketing pages
│   └── api/               # API routes (Stripe webhooks)
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── providers/         # React context providers
│   ├── hooks/             # Custom React hooks
│   └── auth/              # Authentication components
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema
│   ├── auth.ts            # Authentication config
│   ├── currentUser.ts     # User queries
│   └── subscriptions.ts   # Subscription management
├── lib/
│   ├── utils.ts           # Utility functions (cn, cleanConvexError)
│   ├── constants/         # App constants and paths
│   └── payments/          # Stripe integration
├── .claude/               # Claude Code configuration
│   ├── settings.json      # Permissions and hooks
│   ├── rules/             # Convex & TypeScript best practices
│   └── skills/            # Pre-installed skills (see below)
└── .mcp.json              # MCP server configuration
```

## MCP Servers

### Pre-configured (`.mcp.json`)

| Server | Purpose |
|--------|---------|
| **shadcn** | Browse & install UI components with natural language |
| **convex** | Query tables, view logs, manage env vars |
| **next-devtools** | Runtime diagnostics, route info, dev server logs (Next.js 16+) |

### Optional: Vercel MCP (OAuth required)

Add Vercel's official MCP for deployment management:

```bash
claude mcp add --transport http vercel https://mcp.vercel.com
```

Then run `/mcp` to authenticate. Provides:
- Search Vercel documentation
- Manage projects and deployments
- Analyze deployment logs

**Verify all MCP connections:** Run `/mcp` in Claude Code.

## Pre-installed Skills

Located in `.claude/skills/`:

### react-best-practices (Vercel)
45 performance rules across 8 categories from Vercel Engineering:
- **CRITICAL**: Eliminating waterfalls, bundle optimization
- **HIGH**: Server-side performance
- **MEDIUM**: Re-render optimization, rendering performance
- **LOW**: JavaScript performance, advanced patterns

### web-design-guidelines (Vercel)
100+ rules covering accessibility, performance, and UX.

### code-review
PR review checklist with security and quality gates.

### testing
Build verification and testing patterns.

### deployment
Convex + Vercel deployment guide.

## Convex Backend

### Schema Pattern

Tables are defined in `convex/schema.ts` using Convex validators:

```typescript
import { v } from "convex/values"
import { defineTable } from "convex/server"

defineTable({
  userId: v.id("users"),
  settings: v.optional(v.object({...})),
  createdAt: v.string(),  // ISO timestamp
})
  .index("by_user", ["userId"])
```

### Authentication

Uses Convex Auth with Password provider:

```typescript
// Server-side (Server Actions)
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import { fetchQuery, fetchMutation } from "convex/nextjs"

const token = await convexAuthNextjsToken()
const user = await fetchQuery(api.currentUser.get, {}, { token })

// Client-side
import { useAuthActions } from "@convex-dev/auth/react"
const { signIn, signOut } = useAuthActions()
await signIn("password", { email, password, flow: "signIn" })
```

### Query/Mutation Pattern

```typescript
// convex/myModule.ts
import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { auth } from "./auth"

export const getData = query({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) return null
    return await ctx.db.get(args.id)
  },
})
```

## Key Patterns

### Error Handling

Convex errors include stack traces. Extract clean messages:

```typescript
import { cleanConvexError } from "@/lib/utils"

try {
  await signIn("password", { email, password, flow: "signIn" })
} catch (err: any) {
  const cleanError = cleanConvexError(err.message)
  // "Invalid email or password" instead of stack trace
}
```

### Form State with React 19

```typescript
"use client"
import { useState } from "react"

const [pending, setPending] = useState(false)
const [error, setError] = useState<string | null>(null)

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  setPending(true)
  setError(null)

  try {
    // ... action
  } catch (err: any) {
    setError(cleanConvexError(err.message))
    setPending(false)
  }
}
```

### Route Protection

Middleware handles auth redirects (`middleware.ts`):
- Protected routes: `/dashboard(.*)`, `/settings(.*)`
- Auth routes: `/login`, `/signup`

### Tailwind Patterns

- Use `cn()` utility for conditional classes
- Colors via CSS variables: `text-primary`, `bg-secondary`
- Custom breakpoints: `screen-max-sm:`, `screen-min-lg:`

## Environment Variables

Required variables (see `.env.example`):

```bash
NEXT_PUBLIC_CONVEX_URL=     # From Convex dashboard
AUTH_SECRET=                # openssl rand -base64 32
STRIPE_SECRET_KEY=          # From Stripe dashboard
STRIPE_WEBHOOK_SECRET=      # From Stripe CLI or dashboard
```

## Common Tasks

### Adding a New Convex Table

1. Define in `convex/schema.ts`
2. Run `npx convex dev` to sync
3. Create queries/mutations in new file

### Adding a New Protected Route

1. Create route in `app/(dashboard)/your-route/page.tsx`
2. Middleware automatically protects `/dashboard/*`

### Adding shadcn/ui Components

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

### Stripe Checkout Flow

1. Create checkout session with `client_reference_id: userId`
2. Webhook receives `checkout.session.completed`
3. `handleCheckoutCompleted()` updates Convex subscription

## Security Checklist

- Never expose `CONVEX_DEPLOY_KEY` or `STRIPE_SECRET_KEY` client-side
- Always validate user authentication in Convex functions
- Use `auth.getUserId(ctx)` before accessing user data
- Password reset tokens expire in 24 hours
- Activity logging tracks security-relevant events

## Testing

```bash
# Run Convex in test mode
npx convex dev --once

# Run Next.js type checking
pnpm build
```

## Deployment

### Vercel + Convex

1. Deploy Convex: `npx convex deploy`
2. Deploy to Vercel with env vars:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `CONVEX_DEPLOY_KEY`
   - `AUTH_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

### Stripe Webhook Setup

1. Create webhook endpoint: `https://your-domain.com/api/stripe/webhook`
2. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
