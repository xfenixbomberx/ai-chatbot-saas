-- Enable Row Level Security on every application table and add owner-scoped
-- policies. RLS was previously disabled entirely ("RLS is disabled in MVP").
--
-- Writes to bot_documents, chat_messages, and leads continue to happen via
-- the service-role key from api/train, api/upload, api/chat, and api/lead,
-- which bypasses RLS by design -- those routes' own ownership checks
-- (src/lib/auth.ts) are what protect the write paths. These policies only
-- need to cover reads made by logged-in dashboard users via the anon key.

alter table profiles enable row level security;
alter table chatbots enable row level security;
alter table bot_documents enable row level security;
alter table chat_messages enable row level security;
alter table leads enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "chatbots_owner_all" on chatbots
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "bot_documents_owner_select" on bot_documents
  for select
  using (
    exists (
      select 1 from chatbots c
      where c.id = bot_documents.bot_id and c.user_id = auth.uid()
    )
  );

create policy "chat_messages_owner_select" on chat_messages
  for select
  using (
    exists (
      select 1 from chatbots c
      where c.id = chat_messages.bot_id and c.user_id = auth.uid()
    )
  );

create policy "leads_owner_select" on leads
  for select
  using (
    exists (
      select 1 from chatbots c
      where c.id = leads.bot_id and c.user_id = auth.uid()
    )
  );

-- The public RAG widget calls match_bot_documents anonymously (no session).
-- It must run as security definer so it can read bot_documents across the
-- RLS boundary above -- otherwise every public chat query will silently
-- return zero matches instead of erroring. Run this manually if the
-- function wasn't already created this way:
--
-- alter function match_bot_documents(vector, float, int, uuid) security definer;
