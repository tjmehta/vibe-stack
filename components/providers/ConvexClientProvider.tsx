"use client"

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConvexReactClient } from "convex/react"
import { ReactNode, useEffect, useRef, useState } from "react"

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string,
)

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode
}) {
  const [convexQueryClient] = useState(() => new ConvexQueryClient(convex))
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            queryKeyHashFn: convexQueryClient.hashFn(),
            queryFn: convexQueryClient.queryFn(),
            staleTime: Infinity,
          },
        },
      }),
  )

  const isConnected = useRef(false)
  useEffect(() => {
    if (!isConnected.current) {
      convexQueryClient.connect(queryClient)
      isConnected.current = true
    }
  }, [convexQueryClient, queryClient])

  return (
    <ConvexAuthNextjsProvider client={convex}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexAuthNextjsProvider>
  )
}
