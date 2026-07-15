# BirthdayWhisper

Create your birthday page, share the link, and let people leave secret messages — sealed and revealed only on your birthday.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19
- Tailwind CSS v4 (CSS-first config — tokens live in `app/globals.css`, not a `tailwind.config.ts`)
- Prisma 7 + Supabase Postgres (`prisma.config.ts` holds the datasource URL, not `prisma/schema.prisma`)
- Clerk for auth
- TanStack React Query for client-side data/mutations
- Resend for transactional email
- Paystack for gifting/payouts (currently feature-flagged off — see below)
- Vitest + Testing Library for tests

See `AGENTS.md` for the fuller set of framework-version-specific conventions (this is not the Next.js you're used to — several APIs differ from what you'd expect from training data).

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in real values, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.example` to `.env.local` and fill in every value — see the comments in that file for what each one does and which are required vs. optional. At minimum you need: Clerk keys, a Supabase Postgres connection (`DATABASE_URL` + `DIRECT_URL`), a Resend API key, `OPENAI_API_KEY` (message moderation), `CRON_SECRET`, and `ADMIN_CLERK_USER_IDS`.

`NEXT_PUBLIC_APP_URL` matters more than it looks — it's the canonical base URL used for share links and email content. Set it explicitly in whatever hosts production; don't let it inherit a local dev value.

### Database

```bash
npx prisma db push      # sync prisma/schema.prisma → DB
npx prisma generate     # regenerate the Prisma client (needed after any schema change)
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |

## Feature flags

`lib/feature-flags.ts` currently ships with `GIFTING_ENABLED = false` — the birthday-gifting and owner-initiated-payout features are built and tested but hidden from the live product. Flip that one boolean to bring them back; every entry point (nav, public gift form, payout page, and the mutating API routes) is gated off it.

## Project layout

- `app/` — routes. Public pages (`/`, `/b/[username]`, onboarding, sign-in/up) alongside an authenticated app shell (`app/_components/AppShell.tsx`) covering dashboard, jar, wishlist, following, settings, notifications, and payouts.
- `app/admin/` — internal ops tooling, gated by `ADMIN_CLERK_USER_IDS` (see `lib/admin.ts`), layered on top of Clerk's own route protection in `proxy.ts`.
- `lib/` — shared server-side utilities (email, Prisma client, Paystack, moderation, url resolution, etc).
- `prisma/schema.prisma` — data model. `prisma.config.ts` — datasource config (Prisma 7 moved this out of the schema file).
- `tests/unit/` — Vitest suite covering API routes and library functions.
