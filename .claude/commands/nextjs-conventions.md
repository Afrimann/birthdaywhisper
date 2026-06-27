---
description: Non-obvious Next.js 16 + project-specific conventions for BirthdayWhisper. Read this before writing any route, component, or API handler.
---

# Next.js 16 + BirthdayWhisper Conventions

## Version stack (actual, not assumed)

| Package | Version | Key difference from common training data |
|---|---|---|
| Next.js | **16.2.9** | App Router; `middleware.ts` renamed to `proxy.ts` |
| React | **19.2.4** | |
| Tailwind CSS | **v4** | CSS-first; no `tailwind.config.ts` |
| Prisma | **v7.8.0** | No URL in schema; driver adapter required |
| Clerk | **v7.5.9** | `sso()` not `authenticateWithRedirect` |
| Resend | **v6** | |

---

## Critical Next.js 16 differences

### Middleware is `proxy.ts`, not `middleware.ts`
Next.js 16 renamed the middleware entry point. `middleware.ts` is **silently ignored**.

```ts
// proxy.ts  ← must be this name
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
```

### Async params — always `await params`
In Next.js 16, route params and search params are Promises.

```tsx
// app/b/[username]/page.tsx
interface Props { params: Promise<{ username: string }> }

export default async function Page({ params }: Props) {
  const { username } = await params;   // ← must await
}
```

### `export const dynamic = "force-dynamic"` on all DB pages
Any server component or API route that reads the DB or calls `auth()` must opt out of static generation.

```ts
export const dynamic = "force-dynamic"; // first line of file, before imports
```

Required on: every `app/api/**/route.ts`, every dashboard/protected page.

---

## Prisma v7 rules

### No URL in `schema.prisma` — datasource must be bare
```prisma
datasource db {
  provider = "postgresql"
  // NO url or directUrl — they live in prisma.config.ts
}
```

### After every `schema.prisma` change
```bash
npx prisma db push    # syncs schema → DB (uses DIRECT_URL)
npx prisma generate   # regenerates the client (required for TS types)
```
Both are required. Missing `generate` causes TS errors on new fields.

### Prisma client import
```ts
import { prisma } from "@/lib/prisma";  // always this, never new PrismaClient()
```

---

## Clerk v7 rules

### Server vs client imports
```ts
// Server components, API routes, proxy.ts:
import { auth, currentUser } from "@clerk/nextjs/server";

// Client components:
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
```
Importing server helpers in a `"use client"` file causes a runtime crash.

### Auth guard pattern (server component)
```tsx
export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  // ...
}
```

### Google OAuth (mobile-safe)
```tsx
const handleGoogle = () => {          // NOT async
  if (!signIn) return;
  void signIn.sso({                   // void, not await
    strategy: "oauth_google",
    redirectUrl: "/dashboard",
    redirectCallbackUrl: "/sso-callback",
  });
};
```
`async/await` breaks iOS Safari's user-gesture context and silently blocks the redirect.

---

## Tailwind v4 rules

### No `tailwind.config.ts` — all tokens in `globals.css`
```css
/* app/globals.css */
@import "tailwindcss";

@theme inline {
  --color-gold: #F2C14E;   /* → bg-gold, text-gold, border-gold */
  --font-fraunces: var(--font-fraunces);
}
```

### Rgba / alpha values use arbitrary syntax
```tsx
className="bg-[rgba(22,21,25,0.55)] border-[rgba(242,193,78,0.12)]"
```
`--color-*` tokens don't support alpha — use arbitrary values or the `.glass` class.

### Design tokens quick ref
| Token | Value | Utility |
|---|---|---|
| `--color-canvas` | `#0B0B0D` | `bg-canvas` |
| `--color-gold` | `#F2C14E` | `text-gold`, `bg-gold` |
| `--color-gold-bright` | `#FFD874` | `hover:bg-gold-bright` |
| `--color-cream` | `#F4F1EA` | `text-cream` |
| `--color-stone` | `#9A968C` | `text-stone` |
| `--color-ghost` | `#5C5851` | `text-ghost` |
| `--color-pitch` | `#2A2730` | `border-pitch` |

### `.glass` class
```tsx
<div className="glass rounded-2xl p-6">  // don't add extra border-* on top
```
`glass` already sets border + backdrop-filter. Adding a Tailwind border overrides it.

---

## Component structure patterns

### Server component (data) + Client component (interactivity)
```
app/
  onboarding/
    page.tsx          ← server: auth guard + DB fetch + redirect
    OnboardingForm.tsx ← "use client": form state, API calls
```
Keep the server component thin (guard + data). Put all state and event handlers in the client component. This lets tests import the client component without mocking Clerk or Prisma.

### API route structure
```ts
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ...
}
```

### Dynamic route params in API routes
```ts
interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;   // must await
}
```

---

## Mobile / touch conventions
All interactive elements must have:
- `min-h-[44px]` — 44px minimum tap target
- `touch-manipulation` — prevents double-tap zoom delay
- `cursor-pointer` — desktop UX

```tsx
className="... min-h-[44px] touch-manipulation cursor-pointer"
```

---

## File locations
| What | Where |
|---|---|
| Prisma schema | `prisma/schema.prisma` |
| DB config | `prisma.config.ts` |
| Prisma client | `lib/prisma.ts` |
| Email templates | `lib/email-templates.ts` |
| Shared utils | `lib/utils.ts` |
| Global styles | `app/globals.css` |
| Middleware | `proxy.ts` (root) |
| Shared components | `app/_components/` |
| API routes | `app/api/**/route.ts` |
