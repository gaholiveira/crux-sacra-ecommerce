# Crux Sacra — E-commerce for Religious Articles

A full-stack e-commerce application for a religious goods store (rosaries, crucifixes, sacred images, and related items), built as a real production-style project and a hands-on learning exercise in the modern Next.js App Router stack.

Everything below is genuinely implemented and manually tested end-to-end against a real Postgres database, a real Supabase project, and Mercado Pago's real sandbox API — this is not a scaffold or a UI-only demo.

## Features

**Storefront**
- Home page with hero, category grid, "about" section, testimonials, and social links — all pulled from the database where applicable
- Product listing (all products and per-category), product detail pages
- A "Personalizado" category for custom orders: a reference-photo gallery plus a direct WhatsApp contact button, instead of a regular product grid
- Cart: add / increment / decrement / remove, with live item count in the navbar
- Checkout: address management, order creation with **atomic stock decrement** and **optimistic concurrency control** (no overselling under concurrent checkouts)
- **Payment**: Mercado Pago Checkout Bricks embedded directly in the page — credit/debit card and Pix (with inline QR code), backed by Mercado Pago's Orders API
- Customer profile: account info (editable name), saved addresses, order history with live status and shipping tracking info once an admin sets it
- Email/password authentication (sign up, log in, log out) with route-level and Server-Action-level authorization

**Payments (Mercado Pago)**
- Orders API integration (not the legacy Payments API, which Mercado Pago has marked for deprecation) via Checkout Bricks
- Server-side order creation recomputes the total from the database — the amount charged is never trusted from the client
- Idempotency key reused between our own `Order` and Mercado Pago's request, so a double-click or retry can't double-charge
- Webhook endpoint validates the `x-signature` HMAC before trusting anything, then re-fetches the order from Mercado Pago's API rather than trusting the notification body
- Sends the anti-fraud signals Mercado Pago's own "payment approval" checklist recommends: line items with unit price/quantity/category, payer name and address, and a per-order card-statement descriptor
- Payment status mapping was verified against real sandbox transactions rather than the SDK's documentation, which turned out to be wrong (a successful Orders API payment reports `status: "processed"` / `status_detail: "accredited"`, not `"approved"`)

**Admin panel** (role-gated, enforced in the layout *and* in every mutating Server Action — a layout check alone cannot protect a Server Action, which is an independently reachable endpoint)
- Products: create (with image upload, category, variant pricing/stock) and edit existing products, including restocking
- Orders: list with filters (status, customer name/email via URL search params), detail view with items/address/payment history, manual status transitions with an audit trail (`OrderStatusEvent`), and shipping carrier/tracking-code fields that surface back on the customer's order page
- Customers: list with filters (name/email, account type), detail view with addresses, order history, and total spent
- Responsive shell: the sidebar collapses into a mobile top bar with a hamburger menu below `md`, and the active section is derived from the real URL rather than hardcoded

**Polish**
- Fully responsive (mobile-first Tailwind breakpoints across the whole storefront and the admin panel)
- Sticky glassmorphism navbar (`backdrop-filter`, no JS)
- Native, dependency-free page transitions via React's `<ViewTransition>` + the browser View Transitions API
- Lightweight inertia scrolling ([Lenis](https://lenis.dev/), ~3KB)

**Not yet done**
- Production deployment: the app currently only runs against Mercado Pago's sandbox from `localhost`. Going live requires a real domain, which also unblocks verifying the real webhook notification payload shape (Mercado Pago can't reach `localhost`).
- Stock is not automatically restored when a payment fails or is cancelled after the order already decremented it (currently a manual admin fix).
- NFe (Brazilian electronic invoice) emission — designed (provider chosen, trigger point decided) but not implemented yet.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (hosted on Supabase) |
| ORM | Prisma, with the `@prisma/adapter-pg` driver adapter |
| Auth | Supabase Auth (`@supabase/ssr`), cookie-based sessions |
| File storage | Supabase Storage (product images) |
| Payments | Mercado Pago Orders API (Checkout Bricks) |
| Validation | Zod |

## Architecture notes

A few decisions worth calling out, since they were deliberate rather than defaults:

- **Money is stored as integer cents**, never floats, in both the database and in third-party API calls — avoids rounding-error bugs entirely.
- **Idempotency key on `Order`**: a double-click or retried request on checkout cannot create a duplicate order, and the same key is reused against Mercado Pago's API for the same guarantee on their side.
- **Optimistic concurrency on stock**: each `ProductVariant` carries a `stockVersion`; the checkout transaction only commits a stock decrement if the version still matches what was read, otherwise it aborts and the whole order-creation transaction rolls back — verified with an automated test against a real database including the "insufficient stock" rollback path. Admin stock edits bump the same version, so a checkout that read stale stock is rejected instead of overselling.
- **Order line items are snapshotted** (product name, variant name, unit price) at the moment of purchase, never re-derived from the live product — a price change later can't retroactively change a past order.
- **A Data Access Layer (`getCurrentUser`/`requireAdmin`) centralizes authorization**, checked both at the page/layout level (UX) and inside every mutating Server Action (the actual security boundary) — Next.js Server Actions are independently reachable POST endpoints, so a page-level check alone is not sufficient.
- **Ownership checks are baked into every query**, not assumed from client-supplied IDs — e.g. deleting a cart item filters by `cart: { userId }` in the same query, so a forged ID can only ever affect the caller's own data.
- **Admin list filters live in the URL** (`?status=PAID&q=maria`), not client-side React state — the page is reloadable, shareable, and back-button-friendly without any client JS.
- **Payment integration facts were verified against the real API**, not assumed from documentation: several details (a supposedly-optional `payment_method.type` that's actually required, the real success-status vocabulary, which test card numbers work under which API version) turned out to differ from what Mercado Pago's own docs and SDK comments claimed.

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

See `.env.example` for the full list of required environment variables and where to find each one (Supabase dashboard, Mercado Pago dashboard). Payments require a Mercado Pago test account; without those variables set, the storefront and admin panel still work, just without the payment step.

## Project structure

```
prisma/                  # Schema, migrations, seed script
src/app/(store)/         # Public storefront (route group)
src/app/admin/           # Protected admin panel
src/app/api/             # Mercado Pago payment + webhook route handlers
src/lib/                 # Prisma client, Supabase clients, Mercado Pago client, auth DAL
```
