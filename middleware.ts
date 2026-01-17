import type { NextRequest } from "next/server"
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server"
import { NextResponse } from "next/server"

// Define your protected and auth routes
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/settings(.*)"])
const isAuthRoute = createRouteMatcher(["/login", "/signup"])
const isLogoutRoute = createRouteMatcher(["/logout"])

function setIPHeader(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const ip = (request as any).ip
  if (ip) {
    response.headers.set("x-socket-ip", ip)
  } else {
    response.headers.delete("x-socket-ip")
  }
  return response
}

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // Skip middleware for logout route
  if (isLogoutRoute(request)) {
    const response = NextResponse.next()
    return setIPHeader(request, response)
  }

  const isAuthenticated = await convexAuth.isAuthenticated()

  // Redirect authenticated users away from auth pages
  if (isAuthRoute(request) && isAuthenticated) {
    const response = nextjsMiddlewareRedirect(request, "/dashboard")
    return setIPHeader(request, response)
  }

  // Redirect unauthenticated users to login
  if (isProtectedRoute(request) && !isAuthenticated) {
    const response = nextjsMiddlewareRedirect(request, "/login")
    return setIPHeader(request, response)
  }

  const response = NextResponse.next()
  return setIPHeader(request, response)
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
