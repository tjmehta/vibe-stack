# Convex Rules

## Schema Design

### Timestamps

Use ISO string format for all timestamps:

```typescript
const isoTimestamp = () => v.string()

defineTable({
  createdAt: isoTimestamp(),
  updatedAt: isoTimestamp(),
})
```

### Indexes

Always add indexes for:

- Foreign keys (userId, teamId)
- Frequently filtered fields
- Fields used in sorting

```typescript
defineTable({
  userId: v.id("users"),
  status: v.string(),
})
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
```

## Authentication

### Always Check Auth

```typescript
export const myQuery = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) {
      return null // or throw for mutations
    }
    // Continue with userId
  },
})
```

### Mutations Must Verify Ownership

```typescript
export const updateItem = mutation({
  args: { id: v.id("items"), data: v.object({...}) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error("Unauthorized")

    const item = await ctx.db.get(args.id)
    if (item?.userId !== userId) throw new Error("Forbidden")

    await ctx.db.patch(args.id, args.data)
  },
})
```

## Query Patterns

### Use Indexes

```typescript
// Good - uses index
const items = await ctx.db
  .query("items")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect()

// Bad - scans entire table
const items = await ctx.db
  .query("items")
  .filter((q) => q.eq(q.field("userId"), userId))
  .collect()
```

### Limit Results

```typescript
// Paginate large result sets
const items = await ctx.db
  .query("items")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .take(50)
```
