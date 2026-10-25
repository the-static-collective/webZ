-- GARDEN LEDGER 001 — deployed to existing Supabase pantry-gate project
-- Private review queue with service-role-only table access. Reapply only after checking schema drift.
create table if not exists public.garden_entries(
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 kind text not null check(kind in('offer','need','question','experiment','return')),
 lane text not null check(lane in('commons','commerce','care','research')),
 body text not null check(char_length(body) between 12 and 300),
 next_step text not null default '' check(char_length(next_step)<=160),
 status text not null default 'PENDING' check(status in('PENDING','PUBLIC','REJECTED','WITHDRAWN')),
 consent_to_review boolean not null check(consent_to_review=true),
 withdraw_hash text not null check(withdraw_hash ~ '^[a-f0-9]{64}$'),
 source text not null default 'garden-workbench-v1' check(source='garden-workbench-v1'),
 reviewed_at timestamptz,reviewed_by text,review_note text,
 constraint garden_public_requires_review check(status <> 'PUBLIC' or (reviewed_at is not null and reviewed_by is not null and char_length(reviewed_by)>=2))
);
create index if not exists garden_entries_public_idx on public.garden_entries(created_at desc) where status='PUBLIC';
comment on table public.garden_entries is 'Private account-free Garden intake. Public status means owner explicitly reviewed; never automatic or inferred consent/partner commitment.';
alter table public.garden_entries enable row level security;
revoke all on public.garden_entries from public,anon,authenticated;
grant select,insert,update,delete on public.garden_entries to service_role;
create table if not exists public.garden_quotas(
 quota_key text not null check(char_length(quota_key)<=110),
 period text not null check(period ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}(:[0-9]{2})?$'),
 tally integer not null default 0 check(tally>=0),
 primary key(quota_key,period)
);
alter table public.garden_quotas enable row level security;
revoke all on public.garden_quotas from public,anon,authenticated;
grant select,insert,update,delete on public.garden_quotas to service_role;
comment on table public.garden_quotas is 'Aggregate per-hour, per-day, salted per-visitor rate caps.';
create or replace function public.garden_consume_quota(p_key text,p_period text,p_max integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v integer;
begin
 if char_length(p_key)>110 or p_key='' or p_period !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}(:[0-9]{2})?$' or p_max<1 or p_max>1000 then return false;end if;
 insert into public.garden_quotas(quota_key,period,tally) values(p_key,p_period,1)
 on conflict(quota_key,period) do update set tally=public.garden_quotas.tally+1
 where public.garden_quotas.tally < p_max returning tally into v;
 return v is not null;
end $$;
revoke all on function public.garden_consume_quota(text,text,integer) from public,anon,authenticated;
grant execute on function public.garden_consume_quota(text,text,integer) to service_role;
