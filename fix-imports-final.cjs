const fs = require("fs")
const path = require("path")

const fixes = {
  "src/adapters/stripe-adapter.ts": [
    ["from '../../types.ts'", "from '../types.ts'"],
  ],
  "src/adapters/supabase-auth.ts": [
    ["from '../../types.ts'", "from '../types.ts'"],
  ],
  "src/config.ts": [["from 'types.ts'", "from './types.ts'"]],
  "src/core/validation.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/core/createCharge.ts": [
    ["from '../../types.ts'", "from '../types.ts'"],
    ["from './validation.ts'", "from './validation.ts'"],
  ],
  "src/core/validation.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/http/handleChargeRequest.ts": [
    ["from '../../types.ts'", "from '../types.ts'"],
    ["from '../../config.ts'", "from '../config.ts'"],
    [
      "from '../../adapters/stripe-adapter.ts'",
      "from '../adapters/stripe-adapter.ts'",
    ],
    ["from '../../core/validation.ts'", "from '../core/validation.ts'"],
    ["from '../../core/createCharge.ts'", "from '../core/createCharge.ts'"],
    [
      "import('../../types.ts').IdempotencyStore",
      "import('../../types.ts').IdempotencyStore",
    ],
    [
      "import('../../types').IdempotencyStore",
      "import('../../types.ts').IdempotencyStore",
    ],
  ],
  "src/http/next.ts": [
    ["from './handleChargeRequest.ts'", "from './handleChargeRequest.ts'"],
  ],
  "src/index.ts": [
    ["from 'types.ts'", "from './types.ts'"],
    ["from 'config.ts'", "from './config.ts'"],
    ["from 'core/validation.ts'", "from './core/validation.ts'"],
    ["from 'core/createCharge.ts'", "from './core/createCharge.ts'"],
    [
      "from 'adapters/stripe-adapter.ts'",
      "from './adapters/stripe-adapter.ts'",
    ],
    ["from 'adapters/supabase-auth.ts'", "from './adapters/supabase-auth.ts'"],
    [
      "from 'http/handleChargeRequest.ts'",
      "from './http/handleChargeRequest.ts'",
    ],
    ["from 'http/next.ts'", "from './http/next.ts'"],
    ["from 'store.ts'", "from './store'"],
    ["export * from 'types.ts'", "export * from './types.ts'"],
    ["export * from 'config.ts'", "export * from './config.ts'"],
    [
      "export * from 'core/validation.ts'",
      "export * from './core/validation.ts'",
    ],
    [
      "export * from 'core/createCharge.ts'",
      "export * from './core/createCharge.ts'",
    ],
    [
      "export * from 'adapters/stripe-adapter.ts'",
      "export * from './adapters/stripe-adapter.ts'",
    ],
    [
      "export * from 'adapters/supabase-auth.ts'",
      "export * from './adapters/supabase-auth.ts'",
    ],
    [
      "export * from 'http/handleChargeRequest.ts'",
      "export * from './http/handleChargeRequest.ts'",
    ],
    ["export * from 'http/next.ts'", "export * from './http/next.ts'"],
    ["export * from 'store.ts'", "export * from './store'"],
  ],
  "src/react/hooks/useCharge.ts": [
    ["from '../../../types.ts'", "from '../../../types.ts'"],
    ["from '../../../types'", "from '../../../types.ts'"],
  ],
  "src/react/index.ts": [
    ["from './primitives.ts'", "from './primitives.ts'"],
    ["from './MotoChargePanel.ts'", "from './MotoChargePanel.ts'"],
    ["from './hooks/useCharge.ts'", "from './hooks/useCharge.ts'"],
    ["from '../strings.ts'", "from '../strings.ts'"],
  ],
  "src/react/MotoChargePanel.tsx": [
    ["from './hooks/useCharge.ts'", "from './hooks/useCharge.ts'"],
    ["from './primitives.ts'", "from './primitives.ts'"],
    ["from '../../strings.ts'", "from '../../strings.ts'"],
  ],
  "src/react/primitives/index.ts": [
    ["from './Input.ts'", "from './Input.ts'"],
    [
      "export type { InputProps, LabelProps } from './Input.ts'",
      "export type { InputProps, LabelProps } from './Input.ts'",
    ],
    ["from './Button.ts'", "from './Button.ts'"],
    [
      "export type { ButtonProps, ButtonVariant, ButtonSize } from './Button.ts'",
      "export type { ButtonProps, ButtonVariant, ButtonSize } from './Button.ts'",
    ],
    ["from './Select.ts'", "from './Select.ts'"],
    [
      "export type { SelectProps, SelectOption } from './Select.ts'",
      "export type { SelectProps, SelectOption } from './Select.ts'",
    ],
    ["from './StatusAlert.ts'", "from './StatusAlert.ts'"],
    [
      "export type { StatusAlertProps } from './StatusAlert.ts'",
      "export type { StatusAlertProps } from './StatusAlert.ts'",
    ],
    ["from './Card.ts'", "from './Card.ts'"],
    [
      "export type { CardProps, CardHeaderProps, CardTitleProps, CardDescriptionProps, CardContentProps, CardFooterProps } from './Card.ts'",
      "export type { CardProps, CardHeaderProps, CardTitleProps, CardDescriptionProps, CardContentProps, CardFooterProps } from './Card.ts'",
    ],
  ],
  "src/store/in-memory.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/index.ts": [
    ["from '../../types.ts'", "from '../types.ts'"],
    ["from './in-memory.ts'", "from './in-memory.ts'"],
    [
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
    ],
    ["from './postgres.ts'", "from './postgres.ts'"],
    [
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
    ],
    ["from './redis.ts'", "from './redis.ts'"],
    [
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
    ],
    ["from './supabase.ts'", "from './supabase.ts'"],
    [
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
    ],
  ],
  "src/store/postgres.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/redis.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/supabase.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/strings/StringsContext.tsx": [
    ["from './ModuleStrings.ts'", "from './ModuleStrings.ts'"],
    [
      "export { defaultStrings } from './ModuleStrings.ts'",
      "export { defaultStrings } from './ModuleStrings.ts'",
    ],
    [
      "export type { ModuleStrings } from './ModuleStrings.ts'",
      "export type { ModuleStrings } from './ModuleStrings.ts'",
    ],
  ],
  "src/strings/index.ts": [
    ["from './ModuleStrings.ts'", "from './ModuleStrings.ts'"],
    ["from './StringsContext.ts'", "from './StringsContext.ts'"],
    [
      "export * from './ModuleStrings.ts'",
      "export * from './ModuleStrings.ts'",
    ],
    [
      "export * from './StringsContext.ts'",
      "export * from './StringsContext.ts'",
    ],
  ],
  "src/core/validation.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/postgres.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/redis.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/supabase.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/adapters/stripe-adapter.ts": [
    ["from '../../types.ts'", "from '../types.ts'"],
  ],
  "src/adapters/supabase-auth.ts": [
    ["from '../../types.ts'", "from '../types.ts'"],
  ],
  "src/core/validation.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/in-memory.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/index.ts": [
    ["from '../../types.ts'", "from '../types.ts'"],
    ["from './in-memory.ts'", "from './in-memory.ts'"],
    [
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
    ],
    ["from './postgres.ts'", "from './postgres.ts'"],
    [
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
    ],
    ["from './redis.ts'", "from './redis.ts'"],
    [
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
    ],
    ["from './supabase.ts'", "from './supabase.ts'"],
    [
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
    ],
  ],
  "src/core/validation.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/in-memory.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/index.ts": [
    ["from '../../types.ts'", "from '../types.ts'"],
    ["from './in-memory.ts'", "from './in-memory.ts'"],
    [
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
    ],
    ["from './postgres.ts'", "from './postgres.ts'"],
    [
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
    ],
    ["from './redis.ts'", "from './redis.ts'"],
    [
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
    ],
    ["from './supabase.ts'", "from './supabase.ts'"],
    [
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
    ],
  ],
  "src/core/validation.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/in-memory.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/index.ts": [
    ["from '../../types.ts'", "from '../types.ts'"],
    ["from './in-memory.ts'", "from './in-memory.ts'"],
    [
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
    ],
    ["from './postgres.ts'", "from './postgres.ts'"],
    [
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
    ],
    ["from './redis.ts'", "from './redis.ts'"],
    [
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
    ],
    ["from './supabase.ts'", "from './supabase.ts'"],
    [
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
    ],
  ],
  "src/core/validation.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/in-memory.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/index.ts": [
    ["from '../../types.ts'", "from '../types.ts'"],
    ["from './in-memory.ts'", "from './in-memory.ts'"],
    [
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
    ],
    ["from './postgres.ts'", "from './postgres.ts'"],
    [
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
    ],
    ["from './redis.ts'", "from './redis.ts'"],
    [
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
    ],
    ["from './supabase.ts'", "from './supabase.ts'"],
    [
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
    ],
  ],
  "src/core/validation.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/in-memory.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/index.ts": [
    ["from '../../types.ts'", "from '../types.ts'"],
    ["from './in-memory.ts'", "from './in-memory.ts'"],
    [
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
    ],
    ["from './postgres.ts'", "from './postgres.ts'"],
    [
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
    ],
    ["from './redis.ts'", "from './redis.ts'"],
    [
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
    ],
    ["from './supabase.ts'", "from './supabase.ts'"],
    [
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
    ],
  ],
  "src/core/validation.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/in-memory.ts": [["from '../../types.ts'", "from '../types.ts'"]],
  "src/store/index.ts": [
    ["from '../../types.ts'", "from '../types.ts'"],
    ["from './in-memory.ts'", "from './in-memory.ts'"],
    [
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
      "export type { InMemoryIdempotencyStoreOptions } from './in-memory.ts'",
    ],
    ["from './postgres.ts'", "from './postgres.ts'"],
    [
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
      "export type { PostgresIdempotencyStoreOptions } from './postgres.ts'",
    ],
    ["from './redis.ts'", "from './redis.ts'"],
    [
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
      "export type { RedisIdempotencyStoreOptions } from './redis.ts'",
    ],
    ["from './supabase.ts'", "from './supabase.ts'"],
    [
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
      "export type { SupabaseIdempotencyStoreOptions } from './supabase.ts'",
    ],
  ],
}

function fixFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8")
  let modified = false

  for (const [from, to] of replacements) {
    const newContent = content.replace(
      new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      to,
    )
    if (content !== newContent) {
      modified = true
      content = newContent
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8")
    console.log("Fixed:", filePath)
  }
}

for (const [filePath, replacements] of Object.entries(fixes)) {
  fixFile(filePath, replacements)
}

console.log("All fixes applied!")
