import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract clean error message from Convex stack trace
 */
export function cleanConvexError(errorMessage: string): string {
  const uncaughtIndex = errorMessage.indexOf("Uncaught Error: ")
  if (uncaughtIndex === -1) return errorMessage

  const startOfError = uncaughtIndex + "Uncaught Error: ".length
  const newlineIndex = errorMessage.indexOf("\n", startOfError)
  const atIndex = errorMessage.indexOf(" at ", startOfError)

  let endIndex = errorMessage.length
  if (newlineIndex !== -1 && atIndex !== -1) {
    endIndex = Math.min(newlineIndex, atIndex)
  } else if (newlineIndex !== -1) {
    endIndex = newlineIndex
  } else if (atIndex !== -1) {
    endIndex = atIndex
  }

  return errorMessage.substring(startOfError, endIndex).trim()
}
