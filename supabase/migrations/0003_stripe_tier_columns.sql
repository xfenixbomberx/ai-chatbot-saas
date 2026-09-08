-- Replaces the spoofable boolean-only subscription model with real tier/
-- status columns that the new Stripe webhook (src/app/api/stripe/webhook)
-- keeps in sync, instead of the old client-triggered api/success write.
--
-- NOTE: these columns are a deliberate stopgap. Phase 1 (teams & roles)
-- relocates plan/billing ownership from profiles to a new organizations
-- table, since a team's plan shouldn't live on one member's user row.
-- Don't build new business logic against profiles.plan_tier expecting it
-- to be permanent.

alter table profiles
  add column if not exists plan_tier text not null default 'free'
    check (plan_tier in ('free', 'starter', 'pro', 'enterprise')),
  add column if not exists plan_status text not null default 'inactive'
    check (plan_status in ('inactive', 'active', 'past_due', 'canceled')),
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text;

-- Keep is_subscribed readable (dashboard/page.tsx and settings/page.tsx
-- still read it) but derive it from plan_status so it can't drift out of
-- sync with the webhook-driven columns above.
alter table profiles drop column if exists is_subscribed;
alter table profiles
  add column is_subscribed boolean generated always as (plan_status = 'active') stored;
