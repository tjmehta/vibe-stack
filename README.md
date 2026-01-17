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

```bash
# Clone and install
git clone https://github.com/tjmehta/vibe-stack.git my-app
cd my-app
pnpm install

# Connect to Convex (creates your backend)
npx convex dev --configure

# Start developing
pnpm dev              # Terminal 1: Next.js
npx convex dev        # Terminal 2: Convex (keep running)
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## How It Works

**Everything works immediately** - no configuration needed for development basics:

| Feature | Without Config | With Config |
|---------|---------------|-------------|
| **Development** | `pnpm dev` | Full app with backend |
| **Build** | `pnpm build` | Production-ready |
| **Lint & Format** | `pnpm lint` | Same |
| **Unit Tests** | `pnpm test` | Same |
| **Type Check** | `pnpm tsc` | Same |
| **E2E Tests** | - | `pnpm test:e2e` |
| **Auth** | - | Login, signup, sessions |
| **Database** | - | Real-time Convex |
| **Payments** | - | Stripe subscriptions |

## Connect Your Services

### 1. Convex (Database + Auth)

When you run `npx convex dev`, the CLI will:
1. Open your browser to sign in with GitHub
2. Create a new Convex project (or select existing)
3. Generate `.env.local` with your `CONVEX_DEPLOYMENT` URL
4. Sync your schema and start watching for changes

```bash
npx convex dev --configure
```

That's it - your backend is ready. Keep `npx convex dev` running while you develop.

**For your team:** After you commit and push, teammates can run `npx convex dev` to get their own dev environment automatically.

### 2. Stripe (Payments) - Optional

Add your Stripe keys to `.env.local`:

```bash
# Get these from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Then set up webhook endpoint in Stripe Dashboard:
- URL: `https://your-domain.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.*`

### 3. Vercel (Deploy) - Optional

1. **Push to GitHub**
   ```bash
   git remote set-url origin https://github.com/YOUR_USERNAME/my-app.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your GitHub repo
   - Vercel auto-detects Next.js and uses our `vercel.json` config

3. **Add Environment Variables**
   In Vercel project settings, add:
   - `NEXT_PUBLIC_CONVEX_URL` - from `.env.local`
   - `CONVEX_DEPLOY_KEY` - from Convex dashboard → Settings → Deploy Key
   - `AUTH_SECRET` - generate with `openssl rand -base64 32`
   - `STRIPE_SECRET_KEY` - if using payments
   - `STRIPE_WEBHOOK_SECRET` - if using payments

4. **Deploy**
   Click Deploy. Vercel will build and deploy automatically on every push.

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

### Setup GitHub CI

1. Go to repo **Settings** → **Secrets and variables** → **Actions**
2. Add variable: `CONVEX_CONFIGURED = true` (enables E2E tests)
3. Add secrets:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `CONVEX_DEPLOY_KEY`

### Dependabot

Automatic dependency updates run weekly on Mondays.

## Testing

### Unit Tests (Vitest)
```bash
pnpm test              # Watch mode
pnpm test:run          # Single run
pnpm test:coverage     # With coverage report
pnpm test:ui           # Interactive UI
```

### E2E Tests (Playwright)
```bash
pnpm test:e2e          # Run all browsers
pnpm test:e2e:ui       # Interactive UI
```

## Commit Hooks

Pre-configured with [husky](https://typicode.github.io/husky/):

- **pre-commit**: Runs lint-staged (formats staged files)
- **commit-msg**: Enforces [Conventional Commits](https://www.conventionalcommits.org/)

### Commit Message Format
```
<type>: <description>

# Examples:
feat: add user authentication
fix: resolve login redirect issue
docs: update API documentation
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

## Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm format           # Format code with Prettier
pnpm format:check     # Check formatting
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
```

## License

MIT
