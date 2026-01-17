import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">Vibe Stack</h1>
        <p className="text-muted-foreground mb-8 text-xl">
          A production-ready full-stack starter with Next.js 15, Convex, Stripe,
          and shadcn/ui. Start building your SaaS in minutes.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" variant="primary">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="mb-2 font-semibold">Authentication</h3>
            <p className="text-muted-foreground text-sm">
              Convex Auth with email/password, password reset, and session
              management.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="mb-2 font-semibold">Payments</h3>
            <p className="text-muted-foreground text-sm">
              Stripe integration with checkout, webhooks, and subscription
              management.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="mb-2 font-semibold">Real-time</h3>
            <p className="text-muted-foreground text-sm">
              Convex provides real-time data sync out of the box with type-safe
              queries.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
