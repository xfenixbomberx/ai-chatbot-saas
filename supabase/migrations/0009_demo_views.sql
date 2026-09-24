-- Records every open of a bot shareable demo page.
--
-- Conversations only exist once a visitor sends a message, so a prospect who
-- opened an outreach demo link, read the greeting and closed it looked
-- exactly like a prospect who never clicked at all. This table separates the
-- two, which is the difference between a warm lead and silence.
--
-- Apply this BEFORE deploying the code that writes it -- an insert naming an
-- unknown table fails outright.

create table if not exists demo_views (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references chatbots(id) on delete cascade,
  session_id text,
  referrer text,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_demo_views_bot_viewed
  on demo_views (bot_id, viewed_at desc);

alter table demo_views enable row level security;

-- Same org-membership read pattern as chat_messages and leads. Inserts come
-- from /api/demo-view through the service-role key, which bypasses RLS.
create policy "demo_views_org_select" on demo_views
  for select
  using (exists (
    select 1 from chatbots c
    join organization_members m on m.org_id = c.org_id
    where c.id = demo_views.bot_id and m.user_id = auth.uid()
  ));
