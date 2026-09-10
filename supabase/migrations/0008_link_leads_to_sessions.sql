-- Lets a human-handoff alert tell the team how to reach the visitor.
--
-- leads.session_id links a captured email to its conversation. The widget
-- and demo page already know the session; /api/lead just had nowhere to
-- put it. Nullable: leads captured before this have no session.
--
-- chat_messages.is_handoff marks the bot reply that escalated a
-- conversation, so /api/lead can tell when an email arrives after the
-- handoff alert already went out and send the team a follow-up.
--
-- Apply this BEFORE deploying the code that writes these columns -- an
-- insert naming an unknown column fails outright, which would break lead
-- capture and message logging until it's applied.

alter table leads add column if not exists session_id text;
alter table chat_messages add column if not exists is_handoff boolean not null default false;

create index if not exists idx_leads_bot_session
  on leads (bot_id, session_id);

create index if not exists idx_chat_messages_bot_session
  on chat_messages (bot_id, session_id, created_at desc);
