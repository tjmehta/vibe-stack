import { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Dashboard | Vibe Stack",
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button asChild variant="outline">
            <Link href="/logout">Log Out</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Vibe Stack</CardTitle>
              <CardDescription>
                Your full-stack starter is ready to go
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Start building your app by editing the dashboard and adding your
                own features.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>
                Useful resources for your development
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="https://docs.convex.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary block text-sm hover:underline"
              >
                Convex Documentation
              </a>
              <a
                href="https://nextjs.org/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary block text-sm hover:underline"
              >
                Next.js Documentation
              </a>
              <a
                href="https://stripe.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary block text-sm hover:underline"
              >
                Stripe Documentation
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
