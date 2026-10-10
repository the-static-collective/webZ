-- GIVING-TREE-003. Apply only in a dedicated, explicitly approved Supabase project.
-- Tables are never directly readable or writable by public roles; all actions go through a reviewed Edge function.
create table if not exists public.giving_tree_gifts (
 id uuid primary key default gen_random_uuid(),
 digest text not null unique check(digest ~ '^sha256:[0-9a-f]{64}$'),
 title text not null check(char_length(title) between 1 and 84),
 creator text not null check(char_length(creator)<=60),
 permission text not null check(permission in ('VIEW_ONLY','REMIX_ALLOWED')),
 origin_authority text not null check(origin_authority in ('DEMO','SELF_DECLARED')),
 bundle_text text check(bundle_text is null or octet_length(bundle_text)<=32768),
 withdrawal_sha256 text not null check(withdrawal_sha256 ~ '^[0-9a-f]{64}$'),
 state text not null default 'PENDING' check(state in ('PENDING','PUBLISHED','REJECTED','WITHDRAWN')),
 constraint published_has_content check(state<>'PUBLISHED' or bundle_text is not null),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 published_at timestamptz,
 withdrawn_at timestamptz
);
create index if not exists giving_tree_public_recent on public.giving_tree_gifts(published_at desc) where state='PUBLISHED';
create index if not exists giving_tree_pending_recent on public.giving_tree_gifts(created_at) where state='PENDING';
alter table public.giving_tree_gifts enable row level security;
revoke all on table public.giving_tree_gifts from public, anon, authenticated;
grant select,insert,update on table public.giving_tree_gifts to service_role;
-- Intentionally no anon/authenticated policies or grants; human review must occur server-side.
