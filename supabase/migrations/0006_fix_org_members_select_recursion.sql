-- Fixes "infinite recursion detected in policy for relation
-- organization_members" (Postgres error 42P17): the SELECT policy on
-- organization_members queried organization_members itself in a
-- correlated subquery, which re-triggers the same RLS policy recursively.
-- Every client-side read of org membership (org-context.tsx's fetchOrgs,
-- run as the logged-in user, not service role) failed with a 500 as a
-- result -- newly created orgs never appeared in the dashboard even
-- though the organization + owner membership rows were created fine.
--
-- The only direct client-side read of this table only ever needs the
-- current user's own row (org-context.tsx filters .eq("user_id", ...));
-- reading OTHER members' rows for the team page goes through the
-- service-role client in api/org/[id]/members, which bypasses RLS
-- entirely, so this doesn't need to expose more than "your own row."
drop policy "members_select_own_org" on organization_members;

create policy "members_select_own_row" on organization_members
  for select
  using (user_id = auth.uid());
