-- Phase 1: teams & roles. Moves bot ownership from a single chatbots.user_id
-- to an organizations/organization_members model so multiple people can
-- share access to the same bots with different permission levels.

-- Cleanup: one orphaned row in production ("Supabase test bot") has no
-- owner (user_id is null) and can't be assigned to any organization.
-- Confirmed with the user to delete it rather than leave org_id nullable
-- for everything else.
delete from bot_documents where bot_id in (select id from chatbots where user_id is null);
delete from chat_messages where bot_id in (select id from chatbots where user_id is null);
delete from leads where bot_id in (select id from chatbots where user_id is null);
delete from chatbots where user_id is null;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  -- Relocated from profiles (Phase 0's plan_tier/plan_status/stripe_* columns
  -- were a deliberate stopgap) -- an organization, not one member, is the
  -- real billing unit.
  plan_tier text not null default 'free' check (plan_tier in ('free', 'starter', 'pro', 'enterprise')),
  plan_status text not null default 'inactive' check (plan_status in ('inactive', 'active', 'past_due', 'canceled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text
);

create table organization_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table organization_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  -- Built from two core gen_random_uuid() calls instead of pgcrypto's
  -- gen_random_bytes(), which isn't enabled on this project.
  token text not null unique default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  invited_by uuid not null references auth.users(id),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

alter table chatbots add column org_id uuid references organizations(id);

-- Backfill: one organization per existing bot-owning user, named after
-- their email, carrying over their Phase-0 billing columns, with them as
-- 'owner'. Users with no bots don't get an org yet -- they'll create or be
-- invited into one.
do $$
declare
  owner record;
  new_org_id uuid;
begin
  for owner in
    select distinct p.id, au.email, p.plan_tier, p.plan_status,
           p.stripe_customer_id, p.stripe_subscription_id, p.stripe_price_id
    from profiles p
    join auth.users au on au.id = p.id
    where exists (select 1 from chatbots c where c.user_id = p.id)
  loop
    insert into organizations (name, plan_tier, plan_status, stripe_customer_id, stripe_subscription_id, stripe_price_id)
    values (
      coalesce(owner.email, owner.id::text),
      owner.plan_tier,
      owner.plan_status,
      owner.stripe_customer_id,
      owner.stripe_subscription_id,
      owner.stripe_price_id
    )
    returning id into new_org_id;

    insert into organization_members (org_id, user_id, role) values (new_org_id, owner.id, 'owner');

    update chatbots set org_id = new_org_id where user_id = owner.id;
  end loop;
end $$;

alter table chatbots alter column org_id set not null;

-- These Phase-0 policies reference chatbots.user_id directly and must be
-- dropped before the column itself can be, ahead of their org-based
-- replacements further down.
drop policy "chatbots_owner_all" on chatbots;
drop policy "bot_documents_owner_select" on bot_documents;
drop policy "chat_messages_owner_select" on chat_messages;
drop policy "leads_owner_select" on leads;

alter table chatbots drop column user_id;

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table organization_invites enable row level security;

create policy "org_members_can_view_own_org" on organizations
  for select
  using (exists (select 1 from organization_members m where m.org_id = organizations.id and m.user_id = auth.uid()));

create policy "org_owners_admins_update" on organizations
  for update
  using (exists (
    select 1 from organization_members m
    where m.org_id = organizations.id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  ));

create policy "members_select_own_org" on organization_members
  for select
  using (exists (
    select 1 from organization_members m2
    where m2.org_id = organization_members.org_id and m2.user_id = auth.uid()
  ));

create policy "owners_admins_manage_members" on organization_members
  for all
  using (exists (
    select 1 from organization_members m2
    where m2.org_id = organization_members.org_id and m2.user_id = auth.uid() and m2.role in ('owner', 'admin')
  ))
  with check (exists (
    select 1 from organization_members m2
    where m2.org_id = organization_members.org_id and m2.user_id = auth.uid() and m2.role in ('owner', 'admin')
  ));

create policy "org_members_view_invites" on organization_invites
  for select
  using (exists (
    select 1 from organization_members m where m.org_id = organization_invites.org_id and m.user_id = auth.uid()
  ));

create policy "owners_admins_manage_invites" on organization_invites
  for all
  using (exists (
    select 1 from organization_members m
    where m.org_id = organization_invites.org_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  ))
  with check (exists (
    select 1 from organization_members m
    where m.org_id = organization_invites.org_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  ));

-- Replace Phase 0's owner-only chatbots policy with org-membership-based
-- ones (old policy already dropped above, before user_id was dropped).
-- Viewers get read-only access (no insert/update/delete policy).
create policy "chatbots_org_read" on chatbots
  for select
  using (exists (select 1 from organization_members m where m.org_id = chatbots.org_id and m.user_id = auth.uid()));

create policy "chatbots_org_insert" on chatbots
  for insert
  with check (exists (
    select 1 from organization_members m
    where m.org_id = chatbots.org_id and m.user_id = auth.uid() and m.role in ('owner', 'admin', 'editor')
  ));

create policy "chatbots_org_update" on chatbots
  for update
  using (exists (
    select 1 from organization_members m
    where m.org_id = chatbots.org_id and m.user_id = auth.uid() and m.role in ('owner', 'admin', 'editor')
  ));

create policy "chatbots_org_delete" on chatbots
  for delete
  using (exists (
    select 1 from organization_members m
    where m.org_id = chatbots.org_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  ));

-- bot_documents/chat_messages/leads read policies re-keyed through
-- chatbots.org_id instead of chatbots.user_id (writes still happen only
-- via the service-role key from api/train, api/upload, api/chat, api/lead).
-- Old owner-based policies already dropped above.
create policy "bot_documents_org_select" on bot_documents
  for select
  using (exists (
    select 1 from chatbots c
    join organization_members m on m.org_id = c.org_id
    where c.id = bot_documents.bot_id and m.user_id = auth.uid()
  ));

create policy "chat_messages_org_select" on chat_messages
  for select
  using (exists (
    select 1 from chatbots c
    join organization_members m on m.org_id = c.org_id
    where c.id = chat_messages.bot_id and m.user_id = auth.uid()
  ));

create policy "leads_org_select" on leads
  for select
  using (exists (
    select 1 from chatbots c
    join organization_members m on m.org_id = c.org_id
    where c.id = leads.bot_id and m.user_id = auth.uid()
  ));

-- Billing now lives entirely on organizations; these Phase-0 columns on
-- profiles are no longer read or written anywhere in the app.
alter table profiles drop column if exists is_subscribed;
alter table profiles drop column if exists plan_tier;
alter table profiles drop column if exists plan_status;
alter table profiles drop column if exists stripe_customer_id;
alter table profiles drop column if exists stripe_subscription_id;
alter table profiles drop column if exists stripe_price_id;
