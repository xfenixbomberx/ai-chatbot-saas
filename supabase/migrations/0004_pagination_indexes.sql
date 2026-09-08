-- Supports the new .range()-based pagination on the Conversations and
-- Leads dashboard tabs (previously unbounded `select *` fetches).

create index if not exists idx_chat_messages_bot_created
  on chat_messages (bot_id, created_at desc);

create index if not exists idx_leads_bot_captured
  on leads (bot_id, captured_at desc);
