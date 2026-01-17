# TypeScript Rules

## Strict Mode

- Always use strict TypeScript
- Avoid `any` - use `unknown` and narrow types
- Enable all strict checks in tsconfig.json

## Type Patterns

### Convex Types

```typescript
// Import generated types
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

// Use Id<"tableName"> for IDs
type UserId = Id<"users">
```

### Component Props

```typescript
// Prefer interface for props
interface ButtonProps {
  variant?: "primary" | "secondary"
  children: React.ReactNode
}

// Use React.ComponentProps for extending native elements
type InputProps = React.ComponentProps<"input"> & {
  label?: string
}
```

### Server Actions

```typescript
// Define return type explicitly
type ActionState = {
  success?: string
  error?: string
}

export async function myAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // ...
}
```

## Validation

Use Zod for runtime validation:

```typescript
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const result = schema.safeParse(data)
if (!result.success) {
  return { error: result.error.message }
}
```
