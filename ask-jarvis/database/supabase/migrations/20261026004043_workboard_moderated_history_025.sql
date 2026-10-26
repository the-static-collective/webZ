-- WORKBOARD-025 · applied to pantry-gate as migration 20261026004043
-- An isolated, private-by-default queue behind a human-reviewed public feed.
create table if not exists public.workboard_entries(
 id uuid primary key default gen_random_uuid(),
 thread_key text not null check(thread_key in ('grocery','milk','care','artists','park','church')),
 parent_id uuid references public.workboard_entries(id) on delete set null,
 kind text not null check(kind in ('question','concern','offer','proposal','return')),
 body text not null check(char_length(body) between 12 and 400),
 public_body text check(public_body is null or char_length(public_body) between 12 and 400),
 status text not null default 'PENDING' check(status in ('PENDING','PUBLIC_REVIEWED','REJECTED','WITHDRAWN')),
 withdraw_hash text check(withdraw_hash is null or withdraw_hash ~ '^[0-9a-f]{64}$'),
 consent_to_review boolean not null default false check(consent_to_review),
 created_at timestamptz not null default now(),reviewed_at timestamptz,
 published_at timestamptz,reviewed_by text,withdrawn_at timestamptz,
 constraint public_requires_review check(status <> 'PUBLIC_REVIEWED' or
  (public_body is not null and reviewed_at is not null and published_at is not null and reviewed_by is not null)),
 constraint withdrawal_timestamp check(status <> 'WITHDRAWN' or withdrawn_at is not null),
 constraint no_future_publication check(published_at is null or published_at>=created_at)
);
comment on table public.workboard_entries is 'Private pending community comments; only human-reviewed public_body served by Edge. No direct Data API access or inferred partner consent.';
create index if not exists workboard_entries_public_thread_page
 on public.workboard_entries(thread_key,created_at desc,id desc)
 where status='PUBLIC_REVIEWED' or (status='WITHDRAWN' and published_at is not null);
create index if not exists workboard_entries_moderation
 on public.workboard_entries(created_at,id) where status='PENDING';
create table if not exists public.workboard_quotas(
 quota_key text primary key,tally integer not null default 0 check(tally>=0),
 updated_at timestamptz not null default now()
);
comment on table public.workboard_quotas is 'HMAC visitor and global admission counts; no raw network addresses.';
alter table public.workboard_entries enable row level security;
alter table public.workboard_quotas enable row level security;
revoke all on public.workboard_entries from public,anon,authenticated;
revoke all on public.workboard_quotas from public,anon,authenticated;
grant select,insert,update on public.workboard_entries to service_role;
grant select,insert,update on public.workboard_quotas to service_role;

-- Serialize quota reservation across both per-client and global windows,
-- so exhaustion never creates half-committed quota counters.
create or replace function public.workboard_reserve(p_hash text) returns boolean
language plpgsql security definer set search_path='' as $$
declare
 h text:=to_char(now() at time zone 'UTC','YYYYMMDDHH24');
 d text:=to_char(now() at time zone 'UTC','YYYYMMDD');
 ks text[]:=array['g:h:'||h,'g:d:'||d,'c:'||p_hash||':h:'||h,'c:'||p_hash||':d:'||d];
 lim integer[]:=array[45,160,4,12];
 i integer;n integer;
begin
 if p_hash is null or p_hash !~ '^[0-9a-f]{32}$' then return false;end if;
 perform pg_catalog.pg_advisory_xact_lock(170003,25025);
 for i in 1..4 loop
  select tally into n from public.workboard_quotas where quota_key=ks[i];
  if coalesce(n,0)>=lim[i] then return false;end if;
 end loop;
 for i in 1..4 loop
  insert into public.workboard_quotas(quota_key,tally,updated_at)
   values(ks[i],1,now())
   on conflict(quota_key) do update
   set tally=public.workboard_quotas.tally+1,updated_at=excluded.updated_at;
 end loop;
 return true;
end;
$$;
revoke all on function public.workboard_reserve(text) from public,anon,authenticated;
grant execute on function public.workboard_reserve(text) to service_role;
