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

## Quality Checks

```bash
npm run lint
npm run build
```

## Deployment

Deploy the app to Vercel and configure the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` variables in the Vercel project settings.
