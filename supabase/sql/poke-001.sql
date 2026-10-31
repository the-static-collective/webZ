-- POKE-001 · isolated table and owner-local turn-taking.
-- Idempotent setup for a bounded pilot; do not grant table/func access to anon.
create table if not exists public.poke_v1_threads (
  id uuid primary key default gen_random_uuid(),
  sender_hash text not null unique check (sender_hash ~ '^[0-9a-f]{64}$'),
  recipient_hash text not null unique check (recipient_hash ~ '^[0-9a-f]{64}$'),
  sender_pokes integer not null default 1 check (sender_pokes between 1 and 40),
  recipient_pokes integer not null default 0 check (recipient_pokes between 0 and 40),
  last_actor text not null default 'sender' check (last_actor in ('sender','recipient')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  closed_at timestamptz,
  check(sender_hash <> recipient_hash),
  check(sender_pokes + recipient_pokes <= 40)
);
alter table public.poke_v1_threads enable row level security;
revoke all on public.poke_v1_threads from public, anon, authenticated;

create or replace function public.poke_v1_create(p_sender_hash text, p_recipient_hash text)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare n integer; result_id uuid;
begin
  if p_sender_hash is null or p_recipient_hash is null
     or p_sender_hash !~ '^[0-9a-f]{64}$'
     or p_recipient_hash !~ '^[0-9a-f]{64}$'
     or p_sender_hash = p_recipient_hash then
    raise exception 'INVALID_TOKENS';
  end if;
  -- Pilot capacity bound. Serialize creation so concurrent calls cannot exceed it.
  perform pg_catalog.pg_advisory_xact_lock(20261031, 1);
  delete from public.poke_v1_threads
    where expires_at < now() - interval '1 day'
       or closed_at < now() - interval '1 day';
  select count(*) into n from public.poke_v1_threads
    where created_at >= date_trunc('day', now());
  if n >= 100 then raise exception 'PILOT_FULL'; end if;
  insert into public.poke_v1_threads(sender_hash, recipient_hash)
    values(p_sender_hash,p_recipient_hash) returning id into result_id;
  return result_id;
end
$$;

create or replace function public.poke_v1_exchange(p_key_hash text, p_action text)
returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare r public.poke_v1_threads%rowtype; actor text;
begin
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$'
     or p_action not in ('status','poke','close') then
    raise exception 'INVALID_REQUEST';
  end if;
  select * into r from public.poke_v1_threads
    where sender_hash = p_key_hash or recipient_hash = p_key_hash
    for update;
  if not found then raise exception 'UNKNOWN_LINK'; end if;
  actor := case when r.sender_hash = p_key_hash then 'sender' else 'recipient' end;
  if p_action = 'poke' then
    if r.closed_at is not null then raise exception 'ENDED'; end if;
    if r.expires_at < now() then raise exception 'EXPIRED'; end if;
    if r.sender_pokes + r.recipient_pokes >= 40 then raise exception 'LIMIT_REACHED'; end if;
    if r.last_actor = actor then raise exception 'WAIT_FOR_REPLY'; end if;
    update public.poke_v1_threads set
      sender_pokes=sender_pokes + case when actor='sender' then 1 else 0 end,
      recipient_pokes=recipient_pokes + case when actor='recipient' then 1 else 0 end,
      last_actor=actor, updated_at=now()
    where id=r.id returning * into r;
  elsif p_action='close' and r.closed_at is null then
    update public.poke_v1_threads set closed_at=now(),updated_at=now()
      where id=r.id returning * into r;
  end if;
  return pg_catalog.jsonb_build_object(
    'role',actor,
    'sent',case when actor='sender' then r.sender_pokes else r.recipient_pokes end,
    'received',case when actor='sender' then r.recipient_pokes else r.sender_pokes end,
    'can_poke',(r.closed_at is null and r.expires_at > now()
                and r.last_actor <> actor and r.sender_pokes + r.recipient_pokes < 40),
    'ended',r.closed_at is not null,
    'expired',r.expires_at < now(),
    'expires_at',r.expires_at,
    'maxed',r.sender_pokes + r.recipient_pokes >= 40
  );
end
$$;
revoke all on function public.poke_v1_create(text,text) from public,anon,authenticated;
revoke all on function public.poke_v1_exchange(text,text) from public,anon,authenticated;
grant execute on function public.poke_v1_create(text,text) to service_role;
grant execute on function public.poke_v1_exchange(text,text) to service_role;
grant select,insert,update,delete on public.poke_v1_threads to service_role;
