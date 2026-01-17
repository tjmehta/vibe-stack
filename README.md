# Vibe Stack

A production-ready full-stack starter with Next.js 15, Convex, Stripe, and shadcn/ui. Start building your SaaS in minutes.

## Features

- **Next.js 15** - App Router, Server Actions, React 19, Turbopack
- **Convex** - Real-time database, authentication, and backend functions
- **Stripe** - Payment processing and subscription management
- **Tailwind CSS 4** - Utility-first styling with dark mode support
- **shadcn/ui** - Beautiful, accessible UI components
- **TypeScript** - End-to-end type safety
- **Claude Code Ready** - Pre-configured skills and settings for AI-assisted development

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Convex account (free at [convex.dev](https://convex.dev))
- Stripe account (for payments)

### Setup

1. **Clone and install**

```bash
git clone https://github.com/your-org/vibe-stack.git my-app
cd my-app
pnpm install
```

2. **Configure environment**

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `NEXT_PUBLIC_CONVEX_URL` - From Convex dashboard
- `AUTH_SECRET` - Generate with `openssl rand -base64 32`
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` - From Stripe CLI or dashboard

3. **Start Convex**

```bash
npx convex dev
```

4. **Start development server**

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
vibe-stack/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Login, signup, logout
│   ├── (dashboard)/       # Protected dashboard
│   └── api/               # API routes (webhooks)
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── providers/         # Context providers
│   └── hooks/             # Custom React hooks
├── convex/                # Backend functions
│   ├── schema.ts          # Database schema
│   ├── auth.ts            # Auth configuration
│   └── *.ts               # Queries and mutations
├── lib/                   # Utilities and helpers
└── .claude/               # Claude Code configuration
```

## Authentication

Vibe Stack uses Convex Auth with email/password:

```typescript
// Sign up
await signIn("password", { name, email, password, flow: "signUp" })

// Sign in
await signIn("password", { email, password, flow: "signIn" })

// Sign out
await signOut()
```

Protected routes are automatically redirected via middleware.

## Database

Define your schema in `convex/schema.ts`:

```typescript
const schema = defineSchema({
  items: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.string(),
  }).index("by_user", ["userId"]),
})
```

Query data with type-safe functions:

```typescript
export const getItems = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) return []

    return await ctx.db
      .query("items")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()
  },
})
```

## Payments

Stripe integration is pre-configured:

1. Create products in Stripe Dashboard
2. Set up webhook endpoint: `/api/stripe/webhook`
3. Handle subscription events automatically

See `lib/payments/stripe.ts` for implementation.

## Claude Code Integration

This template is fully configured for AI-assisted development with Claude Code.

### MCP Servers (`.mcp.json`)

| Server | Purpose |
|--------|---------|
| **shadcn** | Browse & install UI components with natural language |
| **convex** | Query tables, view logs, manage env vars |
| **next-devtools** | Runtime diagnostics, route info, dev server logs |

**Optional:** Add Vercel MCP for deployment management:
```bash
claude mcp add --transport http vercel https://mcp.vercel.com
```

Verify connections: Run `/mcp` in Claude Code.

### Pre-installed Skills (`.claude/skills/`)

| Skill | Source | Description |
|-------|--------|-------------|
| **react-best-practices** | Vercel | 45 performance rules across 8 categories |
| **web-design-guidelines** | Vercel | 100+ accessibility, performance, UX rules |
| **code-review** | Custom | PR review with security checklist |
| **testing** | Custom | Build verification patterns |
| **deployment** | Custom | Convex + Vercel deployment guide |

### Rules (`.claude/rules/`)

- **convex.md** - Schema design, auth patterns, query optimization
- **typescript.md** - Type safety, error handling, imports

See `CLAUDE.md` for full documentation.

## CI/CD

GitHub Actions workflows are pre-configured:

### Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **CI** | Push/PR to main | Build, type check, lint |
| **Deploy Convex** | Push to main (convex/**) | Deploy backend functions |

### Required Secrets

Add these in GitHub Settings > Secrets:

```
CONVEX_DEPLOY_KEY        # From: npx convex deploy --prod-url
NEXT_PUBLIC_CONVEX_URL   # Your Convex deployment URL
```

### Dependabot

Automatic dependency updates run weekly on Mondays.

## Deployment

### Convex

```bash
npx convex deploy
```

### Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `CONVEX_DEPLOY_KEY`
   - `AUTH_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
4. Deploy

### Stripe Webhook

Configure webhook endpoint in Stripe Dashboard:
- URL: `https://your-domain.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.*`

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm format       # Format code with Prettier
```

## License

MIT
