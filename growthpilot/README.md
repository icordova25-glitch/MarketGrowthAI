# MarketGrowthAI

MarketGrowthAI is an AI marketing and business growth platform. It brings together website, Google, and social signals to produce a Business Growth Score, prioritized insights, and AI-assisted actions.

## Getting Started

Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visitors are directed to `/auth`.

## Authentication

Phase 1B includes account creation, email/password sign-in, password reset requests, logout, and a three-step business onboarding flow.

To enable Supabase authentication, copy `.env.example` to `.env.local` and add the public URL and anon key from the Supabase project:

```bash
cp .env.example .env.local
```

Without those variables, the app runs in clearly labeled demo mode using browser-only session and onboarding data. Demo mode is intended for product walkthroughs, not production use.

## Database Architecture

The Phase 1E Supabase schema lives in `supabase/migrations/0001_marketgrowthai_schema.sql`. It models each business as a tenant with tables for onboarding, connections, website analysis, Google data, social data, AI workflows, and future billing and competitor capabilities.

Apply the migration through the Supabase CLI or paste it into the Supabase SQL Editor after creating the project. It creates the `public.users` profile from `auth.users`, seeds the supported marketing channels, and enables row-level security so a signed-in user can access only records for businesses they own.

Provider credentials and refresh tokens must remain in server-side secrets or an encrypted server-side vault; they are deliberately not stored in `connected_accounts`.

## Billing

The Billing & Plans workspace provides Starter, Growth, Pro, and Agency product tiers, usage-limit display, and agency seat management. The Checkout route at `/api/stripe/checkout` creates a Stripe subscription Checkout Session when `STRIPE_SECRET_KEY` and all plan-specific `STRIPE_PRICE_*` values are configured. In the local demo without Stripe credentials, plan changes are explicitly saved only to browser storage.

Before production release, add a signed Stripe webhook that updates the `subscriptions` and `usage` tables after checkout, renewal, cancellation, and invoice-payment events. Do not trust browser plan state for entitlement decisions.

## Admin Portal

The customer portal and platform administration are separate protected areas of the same application. Customer routes use the main app shell. Owner-only routes live under `/admin` and use a separate operations shell for customer health, subscriptions, revenue, usage, system status, and optimization opportunities.

Production admin authorization uses immutable Supabase `app_metadata.platform_role = owner`, verified by the owner-only route guard and the `0002_platform_admin_roles.sql` migration policies. Do not grant administrative access from user-editable profile metadata, browser storage, or a plan value. For the local demo only, `owner@example.test` acts as the owner account.

The Step 11 admin-membership foundation lives in `supabase/migrations/0003_admin_memberships_and_audit.sql`. It defines owner, platform-admin, support, and analyst membership records plus append-only audit events. A production invite flow must use a server-side Supabase Admin API action to set immutable `app_metadata` claims, send the invitation, and record the audit event. Browser state is demo-only and must never grant access.

## Phase 2: Business Intelligence

The Website Intelligence page includes a live, server-side homepage scanner. It accepts a public `http` or `https` URL and evaluates title and meta tags, heading structure, canonical URLs, image alt text, and visible copy. It intentionally rejects localhost, `.local`, and IP-address targets to prevent server-side request forgery.

Google Search Console, Google Analytics, Google Business Profile, and social performance dashboards are already represented in the product and database model. To replace their current demo data with live provider data, configure the server-side OAuth credentials shown in `.env.example`, register the callback URL with each provider, and apply the Supabase schema before storing connection metadata and synced metrics. Provider access tokens must be encrypted server-side and never sent to the browser.

## Quality Checks

```bash
npm run lint
npm run build
```

## Deployment

Deploy the app to Vercel and configure the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` variables in the Vercel project settings.
