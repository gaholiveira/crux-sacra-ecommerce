# Crux Sacra — E-commerce for Religious Articles

A full-stack e-commerce application for a religious goods store (rosaries, crucifixes, sacred images, and related items), built as a real production-style project and a hands-on learning exercise in the modern Next.js App Router stack.

Everything below is genuinely implemented and manually tested end-to-end against a real Postgres database and a real Supabase project — this is not a scaffold or a UI-only demo.

## Features

**Storefront**
- Home page with hero, category grid, "about" section, testimonials, and social links — all pulled from the database where applicable
- Product listing (all products and per-category), product detail pages
- Cart: add / increment / decrement / remove, with live item count in the navbar
- Checkout: address management, order creation with **atomic stock decrement** and **optimistic concurrency control** (no overselling under concurrent checkouts)
- Customer profile: account info, saved addresses, order history
- Email/password authentication (sign up, log in, log out) with route-level and Server-Action-level authorization

**Admin panel**
- Protected admin area (role-based, enforced in both the layout and the mutating Server Actions — a layout check alone cannot protect a Server Action, which is an independently reachable endpoint)
- Product creation with image upload, category assignment, and variant pricing/stock

**Polish**
- Fully responsive (mobile-first Tailwind breakpoints across the whole storefront)
- Sticky glassmorphism navbar (`backdrop-filter`, no JS)
- Native, dependency-free page transitions via React's `<ViewTransition>` + the browser View Transitions API
- Lightweight inertia scrolling ([Lenis](https://lenis.dev/), ~3KB)

**In progress**
- Payment integration (Mercado Pago Checkout Bricks, chosen specifically for immediate Pix support in Brazil) — order creation and the payment-pending flow are complete; the embedded payment step and webhook-driven confirmation are the next milestone.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (hosted on Supabase) |
| ORM | Prisma, with the `@prisma/adapter-pg` driver adapter |
| Auth | Supabase Auth (`@supabase/ssr`), cookie-based sessions |
| File storage | Supabase Storage (product images) |
| Payments | Mercado Pago (Checkout Bricks) |
| Validation | Zod |

## Architecture notes

A few decisions worth calling out, since they were deliberate rather than defaults:

- **Money is stored as integer cents**, never floats, in both the database and in third-party API calls — avoids rounding-error bugs entirely.
- **Idempotency key on `Order`**: a double-click or retried request on checkout cannot create a duplicate order.
- **Optimistic concurrency on stock**: each `ProductVariant` carries a `stockVersion`; the checkout transaction only commits a stock decrement if the version still matches what was read, otherwise it aborts and the whole order-creation transaction rolls back — verified with an automated test against a real database including the "insufficient stock" rollback path.
- **Order line items are snapshotted** (product name, variant name, unit price) at the moment of purchase, never re-derived from the live product — a price change later can't retroactively change a past order.
- **A Data Access Layer (`getCurrentUser`/`requireAdmin`) centralizes authorization**, checked both at the page/layout level (UX) and inside every mutating Server Action (the actual security boundary) — Next.js Server Actions are independently reachable POST endpoints, so a page-level check alone is not sufficient.
- **Ownership checks are baked into every query**, not assumed from client-supplied IDs — e.g. deleting a cart item filters by `cart: { userId }` in the same query, so a forged ID can only ever affect the caller's own data.

## Getting started

Requires Node.js 22.18+ and a PostgreSQL database (a free [Supabase](https://supabase.com) project works well).

```bash
npm install
cp .env.example .env   # fill in your real values
npx prisma migrate deploy
node prisma/seed-categories.mjs
node scripts/setup-storage-bucket.mjs
npm run dev
```

See `.env.example` for the full list of required environment variables and where to find each one (Supabase dashboard, Mercado Pago dashboard).

## Project structure

```
prisma/                  # Schema, migrations, seed script
src/app/(store)/         # Public storefront (route group)
src/app/admin/           # Protected admin panel
src/lib/                 # Prisma client, Supabase clients, auth DAL
```
