-- Installed separately on active pantry-gate Supabase on 2026-10-28.
-- Private and isolated; the existing Garden/Reality2/seventh-table ledgers are unchanged.
create table if not exists public.commons_inbox_rooms (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 4 and 90),
 region text not null check(char_length(region) between 3 and 90),
 owner_hash text not null check(owner_hash ~ '^[a-f0-9]{64}$'),
 reviewer_hash text not null check(reviewer_hash ~ '^[a-f0-9]{64}$'),
 submitter_hash text not null check(submitter_hash ~ '^[a-f0-9]{64}$'),
 closed boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.commons_inbox_items (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references public.commons_inbox_rooms(id) on delete cascade,
 kind text not null check(kind in ('organizational-need','method-candidate')),
 content_hash text not null check(content_hash ~ '^[a-f0-9]{64}$'),
 packet jsonb not null check(octet_length(packet::text)<=12500),
 created_at timestamptz not null default now(),
 unique(room_id,content_hash),unique(id,room_id)
);
create index if not exists commons_inbox_items_room_idx on public.commons_inbox_items(room_id,created_at desc);
create table if not exists public.commons_inbox_events (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null,item_id uuid not null,
 event_kind text not null check(event_kind in ('HOLD','REFUSE','ACCEPT_FOR_LOCAL_REVIEW','REPORTED_PARTIAL','REPORTED_COMPLETE','BLOCKED')),
 actor_role text not null check(actor_role in ('owner','reviewer')),
 note text not null check(char_length(note) between 12 and 220),
 quantity_reported integer not null default 0 check(quantity_reported between 0 and 100000),
 unit text not null default 'items' check(unit in ('parcels','kg','meals','items','hours','kWh','sessions')),
 created_at timestamptz not null default now(),
 foreign key(item_id,room_id) references public.commons_inbox_items(id,room_id) on delete cascade
);
create index if not exists commons_inbox_events_room_idx on public.commons_inbox_events(room_id,created_at desc);
create table if not exists public.commons_inbox_quotas (
 quota_key text not null check(char_length(quota_key)<=130),
 period text not null check(period ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}(:[0-9]{2})?$'),
 tally integer not null default 0 check(tally>=0),
 primary key(quota_key,period)
);
create or replace function public.commons_inbox_consume_quota(p_key text,p_period text,p_max integer)
returns boolean language plpgsql set search_path='' as $$
declare t integer;
begin
 if p_key is null or length(p_key)>130 or p_period !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}(:[0-9]{2})?$'
 or p_max<1 or p_max>1000 then return false; end if;
 insert into public.commons_inbox_quotas(quota_key,period,tally) values(p_key,p_period,1)
 on conflict(quota_key,period) do update set tally=public.commons_inbox_quotas.tally+1
 where public.commons_inbox_quotas.tally<p_max returning tally into t;
 return t is not null;
end;$$;
revoke all on function public.commons_inbox_consume_quota(text,text,integer) from public,anon,authenticated;
grant execute on function public.commons_inbox_consume_quota(text,text,integer) to service_role;
alter table public.commons_inbox_rooms enable row level security;
alter table public.commons_inbox_items enable row level security;
alter table public.commons_inbox_events enable row level security;
alter table public.commons_inbox_quotas enable row level security;
revoke all on public.commons_inbox_rooms from public,anon,authenticated;
revoke all on public.commons_inbox_items from public,anon,authenticated;
revoke all on public.commons_inbox_events from public,anon,authenticated;
revoke all on public.commons_inbox_quotas from public,anon,authenticated;
grant select,insert,update,delete on public.commons_inbox_rooms to service_role;
grant select,insert,update,delete on public.commons_inbox_items to service_role;
grant select,insert on public.commons_inbox_events to service_role;
grant select,insert,update,delete on public.commons_inbox_quotas to service_role;
