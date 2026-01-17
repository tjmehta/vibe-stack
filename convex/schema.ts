import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const isoTimestamp = () => v.string()

// User settings schema - customize for your app
const userSettings = v.object({
  theme: v.optional(
    v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
  ),
  notifications: v.optional(v.boolean()),
})

// Activity types for audit logging
const activityTypeEnum = v.union(
  v.literal("SIGN_UP"),
  v.literal("SIGN_IN"),
  v.literal("SIGN_OUT"),
  v.literal("UPDATE_PASSWORD"),
  v.literal("DELETE_ACCOUNT"),
  v.literal("UPDATE_ACCOUNT"),
  v.literal("PASSWORD_RESET_REQUESTED"),
  v.literal("PASSWORD_RESET_COMPLETED"),
  v.literal("CREATE_TEAM"),
  v.literal("REMOVE_TEAM_MEMBER"),
  v.literal("INVITE_TEAM_MEMBER"),
  v.literal("ACCEPT_INVITATION"),
)

// Subscription status and plan enums
const subscriptionPlanEnum = v.union(
  v.literal("FREE"),
  v.literal("PRO"),
  v.literal("TEAM"),
)

const subscriptionStatusEnum = v.union(
  v.literal("INCOMPLETE"),
  v.literal("ACTIVE"),
  v.literal("TRIALING"),
  v.literal("CANCELED"),
  v.literal("PAST_DUE"),
)

// =============================================================================
// SCHEMA DEFINITION
// =============================================================================

const schema = defineSchema({
  // Convex Auth tables (users, sessions, etc.)
  ...authTables,

  // Custom user profiles linked to Convex Auth's users table
  userProfiles: defineTable({
    userId: v.id("users"),
    settings: v.optional(userSettings),
    stripeCustomerId: v.optional(v.string()),
    loginCount: v.optional(v.number()),
    createdAt: isoTimestamp(),
    updatedAt: isoTimestamp(),
  }).index("by_user", ["userId"]),

  // Activity logging for security and audit trail
  activityLogs: defineTable({
    action: activityTypeEnum,
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    timestamp: isoTimestamp(),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // Password reset tokens
  passwordResetTokens: defineTable({
    userId: v.id("users"),
    email: v.string(),
    token: v.string(),
    expiresAt: isoTimestamp(),
    createdAt: isoTimestamp(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  // Stripe subscriptions
  subscriptions: defineTable({
    plan: v.optional(subscriptionPlanEnum),
    status: v.optional(subscriptionStatusEnum),
    stripeCustomerId: v.optional(v.string()),
    stripeProductId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    userId: v.optional(v.id("users")),
    createdAt: isoTimestamp(),
    updatedAt: isoTimestamp(),
  })
    .index("byTeamId", ["teamId"])
    .index("byUserId", ["userId"])
    .index("byStripeSubscriptionId", ["stripeSubscriptionId"])
    .index("byStripeCustomerId", ["stripeCustomerId"]),

  // =============================================================================
  // FUTURE TABLES - Uncomment when needed
  // =============================================================================

  // teams: defineTable({
  //   name: v.string(),
  //   createdAt: isoTimestamp(),
  //   updatedAt: isoTimestamp(),
  // }).index("byCreatedAt", ["createdAt"]),

  // teamMembers: defineTable({
  //   teamId: v.id("teams"),
  //   userId: v.id("users"),
  //   role: v.union(v.literal("OWNER"), v.literal("ADMIN"), v.literal("MEMBER")),
  //   createdAt: isoTimestamp(),
  //   updatedAt: isoTimestamp(),
  // })
  //   .index("byTeamId", ["teamId"])
  //   .index("byUserId", ["userId"]),

  // invitations: defineTable({
  //   email: v.string(),
  //   role: v.union(v.literal("OWNER"), v.literal("ADMIN"), v.literal("MEMBER")),
  //   status: v.union(v.literal("PENDING"), v.literal("ACCEPTED"), v.literal("REJECTED")),
  //   createdBy: v.id("users"),
  //   teamId: v.id("teams"),
  //   createdAt: isoTimestamp(),
  //   updatedAt: isoTimestamp(),
  // })
  //   .index("byEmail", ["email"])
  //   .index("byTeamId", ["teamId"]),
})

export default schema
